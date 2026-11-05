import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [
      // The CSV cleaner became the BoQ importer; sources merged into Method.
      { source: "/clean", destination: "/import", permanent: true },
      { source: "/sources", destination: "/method", permanent: true },
    ];
  },
};

export default nextConfig;
