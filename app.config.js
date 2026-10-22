module.exports = ({ config }) => {
  const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();

  if (process.env.EAS_BUILD_PLATFORM === 'android' && !androidGoogleMapsApiKey) {
    throw new Error(
      'Configure GOOGLE_MAPS_ANDROID_API_KEY no ambiente do EAS usado pela build Android.',
    );
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ['react-native-maps', { androidGoogleMapsApiKey }],
    ],
  };
};
