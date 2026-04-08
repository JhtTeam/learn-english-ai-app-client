import {Platform, PermissionsAndroid} from 'react-native';
import {logger} from '@/utils/logger';

const TAG = 'PermissionService';

export type PermissionType = 'microphone' | 'camera' | 'storage';
export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unknown';

class PermissionService {
  async requestMicrophone(): Promise<PermissionStatus> {
    logger.info(TAG, 'Requesting microphone permission');

    if (Platform.OS === 'ios') {
      // iOS microphone permission is handled via Info.plist
      // and requested automatically when recording starts.
      // For explicit check, use react-native-permissions.
      return 'granted';
    }

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

      return this.mapAndroidResult(granted);
    } catch (error) {
      logger.error(TAG, 'Error requesting microphone', error);
      return 'unknown';
    }
  }

  async checkMicrophone(): Promise<PermissionStatus> {
    if (Platform.OS === 'ios') {
      return 'granted'; // Will use react-native-permissions for actual check
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
