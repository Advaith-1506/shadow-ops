import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.museumbreak.app",
  appName: "Shadow Ops",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
