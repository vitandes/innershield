import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  checkPremiumStatus, 
  getAvailableProducts, 
  purchaseProduct, 
  restorePurchases,
  SUBSCRIPTION_PRODUCTS 
} from '../config/revenueCatConfig';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [expirationDate, setExpirationDate] = useState(null);

  // Check premium status on mount and when app becomes active
  useEffect(() => {
    checkSubscriptionStatus();
    loadProducts();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const status = await checkPremiumStatus();
      setIsPremium(status.isPremium);
      setCustomerInfo(status.customerInfo);
      setExpirationDate(status.expirationDate);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const availableProducts = await getAvailableProducts();
      setProducts(availableProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };

  const purchaseSubscription = async (productId) => {
    try {
      setIsLoading(true);
      const result = await purchaseProduct(productId);
      
      if (result.success) {
        setIsPremium(result.isPremium);
        setCustomerInfo(result.customerInfo);
        
        // Update expiration date if premium
        if (result.isPremium && result.customerInfo?.entitlements?.active) {
          const entitlementKeys = Object.keys(result.customerInfo.entitlements.active);
          if (entitlementKeys.length > 0) {
            setExpirationDate(result.customerInfo.entitlements.active[entitlementKeys[0]].expirationDate);
          }
        }
        
        return { success: true, message: 'Subscription purchased successfully!' };
      } else {
        return { success: false, message: result.error || 'Purchase failed' };
      }
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      return { success: false, message: 'Purchase failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const restoreSubscriptions = async () => {
    try {
      setIsLoading(true);
      const result = await restorePurchases();
      
      if (result.success) {
        setIsPremium(result.isPremium);
        setCustomerInfo(result.customerInfo);
        
        // Update expiration date if premium
        if (result.isPremium && result.customerInfo?.entitlements?.active) {
          const entitlementKeys = Object.keys(result.customerInfo.entitlements.active);
          if (entitlementKeys.length > 0) {
            setExpirationDate(result.customerInfo.entitlements.active[entitlementKeys[0]].expirationDate);
          }
        }
        
        return { success: true, message: result.isPremium ? 'Purchases restored successfully!' : 'No active subscriptions found.' };
      } else {
        return { success: false, message: result.error || 'Failed to restore purchases' };
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return { success: false, message: 'Failed to restore purchases. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get product by ID
  const getProductById = (productId) => {
    return products.find(product => product.identifier === productId);
  };

  // Helper function to get formatted price
  const getFormattedPrice = (productId) => {
    const product = getProductById(productId);
    return product ? product.priceString : 'N/A';
  };

  // Helper function to check if a specific feature requires premium
  const requiresPremium = (feature) => {
    // Define which features require premium access
    const premiumFeatures = [
      'advanced_breathing',
      'sleep_sounds',
      'unlimited_journal',
      'premium_insights',
      'custom_reminders',
      'export_data'
    ];
    
    return premiumFeatures.includes(feature);
  };

  // Helper function to show paywall for premium features
  const showPaywallIfNeeded = (feature, navigation) => {
    if (!isPremium && requiresPremium(feature)) {
      navigation.navigate('Paywall', { feature });
      return true;
    }
    return false;
  };

  const value = {
    // State
    isPremium,
    isLoading,
    customerInfo,
    products,
    expirationDate,
    
    // Actions
    checkSubscriptionStatus,
    purchaseSubscription,
    restoreSubscriptions,
    
    // Helpers
    getProductById,
    getFormattedPrice,
    requiresPremium,
    showPaywallIfNeeded,
    
    // Product IDs for easy access
    PRODUCTS: SUBSCRIPTION_PRODUCTS,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};