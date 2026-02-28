import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.heywork.salam',
  appName: 'HeyWork',
  webDir: 'www',
  plugins: {
    StatusBar: {
      overlay: false
    }
  }
};

export default config;
