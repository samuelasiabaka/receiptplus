import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { saveReceipt } from '@/lib/storage';
import { getBusinessProfile } from '@/lib/storage';
import type { ReceiptItem } from '@/models/types';
import { generateReceiptNumber, formatCurrency } from '@/utils/receipt';

export default function CreateReceiptScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [items, setItems] = useState<ReceiptItem[]>([{ description: '', quantity: 1, price: 0 }]);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');

  const colors = Colors[colorScheme ?? 'light'];
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const handleAddItem = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter item description');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const newItem: ReceiptItem = {
      description: description.trim(),
      quantity: parseInt(quantity) || 1,
      price: parseFloat(price),
    };
    setItems([...items, newItem]);
    setDescription('');
    setQuantity('1');
    setPrice('');
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      Alert.alert('Error', 'At least one item is required');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleGenerateReceipt = async () => {
    const validItems = items.filter((item) => item.description.trim() && item.price > 0);
    
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item with description and price');
      return;
    }

    try {
      // Check if business profile exists
      const profile = await getBusinessProfile();
      if (!profile) {
        Alert.alert(
          'Business Profile Required',
          'Please set up your business profile first',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: () => {
                router.push('/business-profile');
              },
            },
          ]
        );
        return;
      }

      const receiptNumber = generateReceiptNumber();
      const receiptTotal = validItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

      const receiptId = await saveReceipt(
        {
          receiptNumber,
          total: receiptTotal,
          createdAt: new Date().toISOString(),
          items: validItems,
        },
        validItems
      );

      router.push(`/receipt-preview?id=${receiptId}`);
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save receipt');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.tabIconDefault }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Create Receipt</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Item Input Section */}
        <View style={[styles.inputSection, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Items</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
              placeholder="Item description"
              placeholderTextColor={colors.tabIconDefault}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, styles.halfInput, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
                placeholder="Qty"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
              <TextInput
                style={[styles.input, styles.halfInput, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
                placeholder="Price"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.tint }]}
              onPress={handleAddItem}
              disabled={!description.trim() || !price}
            >
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <View key={index} style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
              <View style={styles.itemCardContent}>
                <Text style={[styles.itemDescription, { color: colors.text }]}>{item.description || 'New Item'}</Text>
                <Text style={[styles.itemDetails, { color: colors.tabIconDefault }]}>
                  {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveItem(index)}
                style={styles.deleteItemButton}
                disabled={items.length === 1}
              >
                <IconSymbol size={20} name="trash.fill" color={items.length === 1 ? colors.tabIconDefault : '#FF3B30'} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Total Summary */}
        {items.length > 0 && (
          <View style={[styles.totalSection, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Subtotal:</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(total)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={[styles.totalLabelFinal, { color: colors.text }]}>Total:</Text>
              <Text style={[styles.totalValueFinal, { color: colors.tint }]}>{formatCurrency(total)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { borderTopColor: colors.tabIconDefault, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: colors.tint }]}
          onPress={handleGenerateReceipt}
          disabled={items.length === 0 || total === 0}
        >
          <Text style={styles.generateButtonText}>Generate Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  inputSection: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  itemsList: {
    gap: 8,
    marginBottom: 24,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  itemCardContent: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
  },
  deleteItemButton: {
    padding: 8,
  },
  totalSection: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: 16,
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  generateButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

