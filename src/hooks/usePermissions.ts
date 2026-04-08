import {useCallback, useState} from 'react';
import {permissionService, type PermissionStatus} from '@/services/permissions/PermissionService';

export function usePermissions() {
  const [micPermission, setMicPermission] = useState<PermissionStatus>('unknown');

  const requestMicrophone = useCallback(async () => {
    const status = await permissionService.requestMicrophone();
    setMicPermission(status);
    return status;
  }, []);

  const checkMicrophone = useCallback(async () => {
    const status = await permissionService.checkMicrophone();
    setMicPermission(status);
    return status;
  }, []);

  return {
    micPermission,
    isMicGranted: micPermission === 'granted',
    requestMicrophone,
    checkMicrophone,
  };
}
