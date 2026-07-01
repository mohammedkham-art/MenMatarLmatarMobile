import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Men Matar L Matar',
  slug: 'men-matar-l-matar',
  version: '1.1.6',
  orientation: 'portrait',
  scheme: 'menmatarlmatar',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'ma.menmatarlmatar.app',
    buildNumber: '15',
    supportsTablet: false,
  },
  android: {
    package: 'ma.menmatarlmatar.app',
    versionCode: 16,
    backgroundColor: '#FFFFFF',
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
  },
  extra: {
    apiBaseUrl: 'https://menmatarlmatar.ma',
    router: {},
    eas: {
      projectId: '26133842-c75e-4b3a-8812-94b678911336',
    },
  },
  plugins: [
    'expo-router',
    'expo-system-ui',
    [
      'expo-notifications',
      {
        icon: './assets/notif-icon.png',
        color: '#0f3d2e',
        defaultChannel: 'default',
      },
    ],
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        image: './assets/splash-icon.png',
        imageWidth: 150,
        resizeMode: 'contain',
      },
    ],
  ],
  owner: 'menmatarlmatar',
};

export default config;