import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import type { Receipt, BusinessProfile } from '@/models/types';
import { formatCurrency, formatDate } from '@/utils/receipt';

interface ReceiptViewProps {
  receipt: Receipt;
  businessProfile: BusinessProfile;
}

export default function ReceiptView({ receipt, businessProfile }: ReceiptViewProps) {
  return (
    <View style={styles.container}>
      {/* Logo Placeholder */}
      {businessProfile.logoUri ? (
        <Image source={{ uri: businessProfile.logoUri }} style={styles.logo} />
      ) : (
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>📦</Text>
        </View>
      )}

      {/* Business Info */}
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{businessProfile.name}</Text>
        {businessProfile.address && <Text style={styles.businessText}>{businessProfile.address}</Text>}
        {businessProfile.phone && <Text style={styles.businessText}>{businessProfile.phone}</Text>}
        {businessProfile.cacNumber && (
          <Text style={styles.businessText}>CAC: {businessProfile.cacNumber}</Text>
        )}
      </View>

      {/* Receipt Details */}
      <View style={styles.receiptDetails}>
        <Text style={styles.receiptText}>Receipt #: {receipt.receiptNumber}</Text>
        <Text style={styles.receiptText}>Date: {formatDate(receipt.createdAt)}</Text>
      </View>

      {/* Items */}
      <View style={styles.itemsContainer}>
        {receipt.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.itemDetails}>
                {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
              </Text>
            </View>
            <Text style={styles.itemTotal}>{formatCurrency(item.quantity * item.price)}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalAmount}>{formatCurrency(receipt.total)}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank you for your patronage!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000000',
    maxWidth: 400,
    width: '100%',
  },
  logoPlaceholder: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 48,
  },
  businessInfo: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 12,
    marginBottom: 12,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
  },
  businessText: {
    fontSize: 12,
    color: '#000000',
    marginTop: 2,
  },
  receiptDetails: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 12,
    marginBottom: 12,
  },
  receiptText: {
    fontSize: 12,
    color: '#000000',
    marginTop: 2,
  },
  itemsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 12,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 11,
    color: '#666666',
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 12,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
});

