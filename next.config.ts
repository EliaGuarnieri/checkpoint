import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./certs/supabase-ca.crt"],
  },
};

export default nextConfig;
