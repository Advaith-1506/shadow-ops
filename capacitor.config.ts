import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.museumbreak.app',
  appName: 'Museum Break',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

