import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys - Replace with your actual keys
const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_YQKATsINAnTlNVeodERGHUBQdZO', // Replace with your iOS API key
  android: 'goog_YOUR_ANDROID_API_KEY_HERE', // Replace with your Android API key
});

// Product identifiers - Replace with your actual product IDs
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'innershield_monthly_premium',
  YEARLY: 'innershield_yearly_premium',
  WEEKLY: 'innershield_weekly_premium',
};

// Entitlement identifier - Replace with your actual entitlement
export const ENTITLEMENT_ID = 'premium';

// Initialize RevenueCat
export const initializeRevenueCat = async (userId = null) => {
  try {
    if (!REVENUECAT_API_KEY) {
      console.warn('RevenueCat API key not configured for this platform');
      return false;
    }

    // Configure RevenueCat
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId, // Optional: pass user ID for cross-platform support
    });

    // Enable debug logs in development
    if (__DEV__) {
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    console.log('RevenueCat initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    return false;
  }
};

// Check if user has premium access
export const checkPremiumStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    return {
      isPremium,
      customerInfo,
      expirationDate: isPremium ? customerInfo.entitlements.active[ENTITLEMENT_ID].expirationDate : null,
    };
  } catch (error) {
    console.error('Error checking premium status:', error);
    return { isPremium: false, customerInfo: null, expirationDate: null };
  }
};

// Get available products
export const getAvailableProducts = async () => {
  try {
    const products = await Purchases.getProducts(Object.values(SUBSCRIPTION_PRODUCTS));
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

// Purchase a product
export const purchaseProduct = async (productId) => {
  try {
    const { customerInfo } = await Purchases.purchaseProduct(productId);
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    return {
      success: true,
      isPremium,
      customerInfo,
    };
  } catch (error) {
    console.error('Error purchasing product:', error);
    
    // Handle different error types
    if (error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED) {
      return { success: false, error: 'Purchase cancelled by user' };
    } else if (error.code === Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING) {
      return { success: false, error: 'Payment is pending' };
    } else {
      return { success: false, error: error.message || 'Purchase failed' };
    }
  }
};

// Restore purchases
export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    return {
      success: true,
      isPremium,
      customerInfo,
    };
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return { success: false, error: error.message || 'Failed to restore purchases' };
  }
};

// Get customer info
export const getCustomerInfo = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Error getting customer info:', error);
    return null;
  }
};