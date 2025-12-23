import type { BusinessProfile, Receipt } from '@/models/types';
import { formatCurrency, formatDate, formatNumber } from '@/utils/receipt';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface ReceiptViewProps {
  receipt: Receipt;
  businessProfile: BusinessProfile;
}

// Logo component that handles errors gracefully
function LogoImage({ logoUri }: { logoUri: string }) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return <Text style={styles.receiptTitle}>RECEIPT</Text>;
  }
  
  return (
    <Image 
      source={{ uri: logoUri }} 
      style={styles.logo} 
      resizeMode="contain"
      onError={() => {
        // Silently handle error - don't log it
        setHasError(true);
      }}
    />
  );
}

// Watermark logo component that handles errors gracefully
function WatermarkLogo({ logoUri }: { logoUri: string }) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return null; // Don't show watermark if logo fails to load
  }
  
  return (
    <View style={styles.watermarkContainer}>
      <Image
        source={{ uri: logoUri }}
        style={styles.watermarkLogo}
        resizeMode="contain"
        onError={() => {
          // Silently handle error - don't log it
          setHasError(true);
        }}
      />
    </View>
  );
}

export default function ReceiptView({ receipt, businessProfile }: ReceiptViewProps) {
  return (
    <View style={styles.container}>
      {/* Watermark Logo Background */}
      {businessProfile.logoUri && (
        <WatermarkLogo logoUri={businessProfile.logoUri} />
      )}
      
      {/* Header Section */}
      <View style={[styles.header, styles.contentLayer]}>
        <View style={styles.headerLeft}>
          <Text style={styles.businessName}>{businessProfile.name}</Text>
          {businessProfile.address && <Text style={styles.businessAddress}>{businessProfile.address}</Text>}
          {businessProfile.phone && <Text style={styles.businessPhone}>{businessProfile.phone}</Text>}
          {businessProfile.cacNumber && (
            <Text style={styles.businessCac}>{businessProfile.cacNumber}</Text>
          )}
          {businessProfile.websiteUri && (
            <Text style={styles.businessWebsite}>{businessProfile.websiteUri}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {businessProfile.logoUri ? (
            <LogoImage logoUri={businessProfile.logoUri} />
          ) : (
            <Text style={styles.receiptTitle}>RECEIPT</Text>
          )}
        </View>
      </View>

      {/* Receipt Details */}
      <View style={[styles.receiptDetailsRow, styles.contentLayer]}>
        <View style={styles.receiptDetailsLeft}>
          <View style={styles.billedToSection}>
            <Text style={styles.billedToLabel}>Billed To</Text>
            <Text style={styles.customerName}>{receipt.customerName}</Text>
            {receipt.customerPhone && (
              <Text style={styles.customerPhone}>{receipt.customerPhone}</Text>
            )}
          </View>
        </View>
        <View style={styles.receiptDetailsRight}>
          <Text style={styles.receiptNumber} numberOfLines={1} ellipsizeMode="tail">Receipt #: {receipt.receiptNumber}</Text>
          <Text style={styles.receiptDate} numberOfLines={1} ellipsizeMode="tail">Date: {formatDate(receipt.createdAt)}</Text>
          {receipt.paymentStatus === 'paid' && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>Paid</Text>
            </View>
          )}
        </View>
      </View>

      {/* Items Table Header */}
      <View style={[styles.tableHeader, styles.contentLayer]}>
        <Text style={[styles.tableHeaderText, styles.colQty]}>QTY</Text>
        <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
        <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>Unit Price</Text>
        <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
      </View>

      {/* Items Table Body */}
      <View style={[styles.tableBody, styles.contentLayer]}>
        {receipt.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colQty]}>
              {item.quantity % 1 === 0 ? item.quantity.toString() : item.quantity.toFixed(2)}
            </Text>
            <Text style={[styles.tableCell, styles.colDescription]} numberOfLines={2} ellipsizeMode="tail">{item.description}</Text>
            <Text style={[styles.tableCell, styles.colUnitPrice]}>{formatNumber(item.price)}</Text>
            <Text style={[styles.tableCell, styles.colAmount]}>{formatNumber(item.quantity * item.price)}</Text>
          </View>
        ))}
      </View>

      {/* Summary Section */}
      <View style={[styles.summary, styles.contentLayer]}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(receipt.total)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(receipt.total)}</Text>
        </View>
        
        {/* Payment Information - Show when part payment */}
        {receipt.paymentStatus === 'part_paid' && receipt.amountPaid !== undefined && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Paid:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(receipt.amountPaid)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.balanceRow]}>
              <Text style={styles.balanceLabel}>Balance:</Text>
              <Text style={styles.balanceValue}>{formatCurrency(receipt.total - receipt.amountPaid)}</Text>
            </View>
          </>
        )}
      </View>

      {/* Notes Section - Temporarily Disabled */}
      {/* {receipt.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{receipt.notes}</Text>
        </View>
      )} */}

      {/* Footer */}
      <View style={[styles.footer, styles.contentLayer]}>
        <Text style={styles.footerText}>
          {businessProfile.customFooter || 'Thank you for your patronage!'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
    pointerEvents: 'none',
  },
  watermarkLogo: {
    width: 300,
    height: 300,
    opacity: 0.1,
  },
  contentLayer: {
    position: 'relative',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  businessPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  businessCac: {
    fontSize: 12,
    color: '#6B7280',
  },
  businessWebsite: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  logoPlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#14B8A6', // Secondary brand color
    letterSpacing: 2,
  },
  receiptDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  receiptDetailsLeft: {
    flex: 1,
    marginRight: 16,
  },
  receiptDetailsRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  billedToSection: {
    marginBottom: 8,
  },
  billedToLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#14B8A6',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  customerPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  receiptNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    flexShrink: 1,
  },
  receiptDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    flexShrink: 1,
  },
  paidBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  paidBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#14B8A6',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tableBody: {
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    fontSize: 13,
    color: '#374151',
  },
  colQty: {
    flex: 0.5,
    textAlign: 'left',
    paddingRight: 4,
  },
  colDescription: {
    flex: 1.8,
    paddingHorizontal: 8,
  },
  colUnitPrice: {
    flex: 1.2,
    textAlign: 'right',
    paddingRight: 4,
  },
  colAmount: {
    flex: 1.2,
    textAlign: 'right',
    fontWeight: '600',
  },
  summary: {
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB', // Primary brand color
  },
  balanceRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444', // Red for outstanding balance
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#14B8A6',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
