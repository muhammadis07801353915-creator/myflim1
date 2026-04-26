import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions,
  Platform
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SIZES } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Check, X, ShieldCheck, Zap, Monitor } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface ProModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProSubscriptionModal({ visible, onClose }: ProModalProps) {
  const features = [
    { icon: <ShieldCheck size={20} color={COLORS.primary} />, text: 'No Ads & Pop-ups' },
    { icon: <Monitor size={20} color={COLORS.primary} />, text: 'Unlimited 4K Content' },
    { icon: <Zap size={20} color={COLORS.primary} />, text: 'Faster Buffering Speeds' },
    { icon: <Monitor size={20} color={COLORS.primary} />, text: 'Watch on 5 Devices' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color="white" />
          </TouchableOpacity>

          <LinearGradient
            colors={[COLORS.primary, '#7f1d1d']}
            style={styles.header}
          >
            <Crown size={60} color="white" fill="white" />
            <Text style={styles.headerTitle}>Upgrade to PRO</Text>
            <Text style={styles.headerSubtitle}>Unlock the best streaming experience</Text>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.featuresList}>
              {features.map((feature, i) => (
                <View key={i} style={styles.featureItem}>
                  <View style={styles.featureIcon}>{feature.icon}</View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                  <Check size={18} color={COLORS.success} />
                </View>
              ))}
            </View>

            <View style={styles.pricingContainer}>
               <View style={styles.priceCard}>
                  <Text style={styles.priceLabel}>Monthly Plan</Text>
                  <Text style={styles.priceValue}>$4.99<Text style={styles.pricePeriod}>/mo</Text></Text>
                  <Text style={styles.priceDescr}>Billed every month</Text>
                  <View style={styles.activeBadge}>
                     <Text style={styles.activeText}>MOST POPULAR</Text>
                  </View>
               </View>
            </View>

            <TouchableOpacity style={styles.subscribeButton}>
              <Text style={styles.subscribeText}>Subscribe Now</Text>
            </TouchableOpacity>

            <Text style={styles.footerNote}>Cancel anytime in Settings. Terms Apply.</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: height * 0.85,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  headerTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 16,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 6,
  },
  content: {
    padding: SPACING.lg,
  },
  featuresList: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  featureIcon: {
    width: 40,
  },
  featureText: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  pricingContainer: {
    marginBottom: 30,
  },
  priceCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  priceLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priceValue: {
    color: 'white',
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 4,
  },
  pricePeriod: {
    fontSize: 16,
    fontWeight: 'normal',
    color: COLORS.textMuted,
  },
  priceDescr: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  activeBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subscribeButton: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  subscribeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerNote: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 20,
  }
});
