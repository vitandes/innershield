const { withAppDelegate } = require('@expo/config-plugins');

const withFirebaseSwift = (config) => {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language === 'swift') {
      let contents = config.modResults.contents;
      
      // Add Firebase import if not present
      if (!contents.includes('import Firebase')) {
        contents = contents.replace(
          /import UIKit/,
          'import UIKit\nimport Firebase'
        );
      }
      
      // Add Firebase configuration in didFinishLaunchingWithOptions
      if (!contents.includes('FirebaseApp.configure()')) {
        contents = contents.replace(
          /(func application\(_ application: UIApplication, didFinishLaunchingWithOptions[^{]*\{)/,
          '$1\n    FirebaseApp.configure()'
        );
      }
      
      config.modResults.contents = contents;
    }
    
    return config;
  });
};

module.exports = withFirebaseSwift;