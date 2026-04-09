import {Platform, PermissionsAndroid, Linking, Alert} from 'react-native';
import {logger} from '@/utils/logger';

const TAG = 'PermissionService';

export type PermissionType = 'microphone' | 'camera' | 'storage';
export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unknown';

/**
 * Cross-platform permission management.
 *
 * For WebRTC (react-native-webrtc), getUserMedia triggers the native
 * permission dialog automatically. This service provides:
 * 1. Pre-flight checks before starting a voice session
 * 2. Handling of permanently denied ("blocked") permissions
 * 3. User-friendly prompts to open Settings
 *
 * On iOS: uses react-native-permissions for granular check/request.
 * On Android: uses PermissionsAndroid from react-native core.
 */
class PermissionService {
  async requestMicrophone(): Promise<PermissionStatus> {
    logger.info(TAG, 'Requesting microphone permission');

    if (Platform.OS === 'ios') {
      return this.requestMicrophoneIOS();
    }

    return this.requestMicrophoneAndroid();
  }

  async checkMicrophone(): Promise<PermissionStatus> {
    if (Platform.OS === 'ios') {
      return this.checkMicrophoneIOS();
    }

    try {
      const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      return result ? 'granted' : 'denied';
    } catch {
      return 'unknown';
    }
  }

  async requestMultiple(
    permissions: PermissionType[],
  ): Promise<Record<PermissionType, PermissionStatus>> {
    const results: Record<string, PermissionStatus> = {};

    for (const permission of permissions) {
      switch (permission) {
        case 'microphone':
          results[permission] = await this.requestMicrophone();
          break;
        default:
          results[permission] = 'unknown';
      }
    }

    return results as Record<PermissionType, PermissionStatus>;
  }

  /**
   * Show an alert guiding the user to open Settings when permission is blocked.
   */
  showBlockedAlert(permission: PermissionType): void {
    const permissionName = permission.charAt(0).toUpperCase() + permission.slice(1);

    Alert.alert(
      `${permissionName} Permission Required`,
      `LearnEng needs ${permission} access for voice lessons. Please enable it in Settings.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Open Settings', onPress: () => Linking.openSettings()},
      ],
    );
  }

  // --- iOS ---

  private async requestMicrophoneIOS(): Promise<PermissionStatus> {
    try {
      // react-native-permissions provides granular iOS permission handling
      // Import dynamically to avoid crash if not installed
      const {check, request, PERMISSIONS, RESULTS} = await import('react-native-permissions');

      const currentStatus = await check(PERMISSIONS.IOS.MICROPHONE);

      if (currentStatus === RESULTS.GRANTED) return 'granted';
      if (currentStatus === RESULTS.BLOCKED) {
        this.showBlockedAlert('microphone');
        return 'blocked';
      }

      const result = await request(PERMISSIONS.IOS.MICROPHONE);
      return this.mapIOSResult(result);
    } catch {
      // Fallback: rely on getUserMedia to trigger permission dialog
      logger.warn(TAG, 'react-native-permissions not available, falling back to getUserMedia');
      return 'granted';
    }
  }

  private async checkMicrophoneIOS(): Promise<PermissionStatus> {
    try {
      const {check, PERMISSIONS} = await import('react-native-permissions');
      const result = await check(PERMISSIONS.IOS.MICROPHONE);
      return this.mapIOSResult(result);
    } catch {
      return 'unknown';
    }
  }

  private mapIOSResult(result: string): PermissionStatus {
    switch (result) {
      case 'granted':
      case 'limited':
        return 'granted';
      case 'denied':
        return 'denied';
      case 'blocked':
        return 'blocked';
      default:
        return 'unknown';
    }
  }

  // --- Android ---

  private async requestMicrophoneAndroid(): Promise<PermissionStatus> {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'LearnEng needs access to your microphone for voice lessons.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );

      const status = this.mapAndroidResult(granted);

      if (status === 'blocked') {
        this.showBlockedAlert('microphone');
      }

      return status;
    } catch (error) {
      logger.error(TAG, 'Error requesting microphone', error);
      return 'unknown';
    }
  }

  private mapAndroidResult(result: string): PermissionStatus {
    switch (result) {
      case PermissionsAndroid.RESULTS.GRANTED:
        return 'granted';
      case PermissionsAndroid.RESULTS.DENIED:
        return 'denied';
      case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
        return 'blocked';
      default:
        return 'unknown';
    }
  }
}

export const permissionService = new PermissionService();
