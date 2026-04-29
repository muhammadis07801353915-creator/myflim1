import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { supabase } from '../api/supabase';

const APK_MIME_TYPE = 'application/vnd.android.package-archive';
const FLAG_GRANT_READ_URI_PERMISSION = 1;
const FLAG_ACTIVITY_NEW_TASK = 268435456;

export type AppUpdateInfo = {
  version: string;
  buildVersion?: string | null;
  apkUrl: string;
  releaseNotes?: string | null;
  mandatory?: boolean | null;
};

type SupabaseUpdateRow = {
  version: string;
  build_version?: string | null;
  apk_url: string;
  release_notes?: string | null;
  mandatory?: boolean | null;
};

export function getCurrentVersion(): string {
  return Application.nativeApplicationVersion || '0.0.0';
}

export function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map((part) => Number(part) || 0);
  const bParts = b.split('.').map((part) => Number(part) || 0);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLength; i += 1) {
    const left = aParts[i] || 0;
    const right = bParts[i] || 0;
    if (left > right) return 1;
    if (left < right) return -1;
  }

  return 0;
}

export async function fetchLatestAndroidUpdate(): Promise<AppUpdateInfo | null> {
  const { data, error } = await supabase
    .from('app_updates')
    .select('version, build_version, apk_url, release_notes, mandatory')
    .eq('platform', 'android')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<SupabaseUpdateRow>();

  if (error) {
    throw error;
  }

  if (!data?.version || !data?.apk_url) {
    return null;
  }

  return {
    version: data.version,
    buildVersion: data.build_version ?? null,
    apkUrl: data.apk_url,
    releaseNotes: data.release_notes ?? null,
    mandatory: data.mandatory ?? false,
  };
}

export async function checkForAvailableUpdate(): Promise<AppUpdateInfo | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  const latest = await fetchLatestAndroidUpdate();
  if (!latest) {
    return null;
  }

  const currentVersion = getCurrentVersion();
  return compareVersions(latest.version, currentVersion) > 0 ? latest : null;
}

export async function downloadAndInstallUpdate(
  update: AppUpdateInfo,
  onProgress?: (progress: number) => void
): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('In-app APK installs are only supported on Android.');
  }

  if (!FileSystem.documentDirectory) {
    throw new Error('Unable to access app storage.');
  }

  const safeVersion = update.version.replace(/[^0-9A-Za-z._-]/g, '_');
  const targetUri = `${FileSystem.documentDirectory}updates/myflim-${safeVersion}.apk`;
  const targetDir = `${FileSystem.documentDirectory}updates`;

  await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });

  const downloadTask = FileSystem.createDownloadResumable(
    update.apkUrl,
    targetUri,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      if (!onProgress || totalBytesExpectedToWrite <= 0) {
        return;
      }
      onProgress(totalBytesWritten / totalBytesExpectedToWrite);
    }
  );

  const result = await downloadTask.downloadAsync();
  if (!result?.uri) {
    throw new Error('APK download failed.');
  }

  const contentUri = await FileSystem.getContentUriAsync(result.uri);

  try {
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      type: APK_MIME_TYPE,
      flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK,
    });
  } catch (error) {
    if (Application.applicationId) {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES,
        {
          data: `package:${Application.applicationId}`,
        }
      );
    }
    throw error;
  }
}
