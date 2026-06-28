/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    // The Virtual Fitting Room uses the MoveNet (TensorFlow.js) runtime only.
    // `@tensorflow-models/pose-detection` statically references the optional
    // `@mediapipe/*` runtimes, which we intentionally do not install. Aliasing
    // them to `false` lets webpack resolve them to empty modules so the build
    // never fails on these unused optional peers.
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@mediapipe/pose": false,
      "@mediapipe/selfie_segmentation": false,
    };
    return config;
  },
};

export default nextConfig;
