import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAllInventoryItems, saveInventoryItem, updateInventoryItem, deleteInventoryItem, searchInventoryItems } from '@/lib/storage';
import { initDb } from '@/lib/database';
import type { InventoryItem } from '@/models/types';
import { formatCurrency } from '@/utils/receipt';

export default function InventoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchItems();
    } else if (searchQuery.length === 0) {
      loadItems();
    }
  }, [searchQuery]);

  const loadItems = async () => {
    try {
      await initDb();
      const allItems = await getAllInventoryItems();
      setItems(allItems);
    } catch (error) {
      console.error('Error loading inventory:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const searchItems = async () => {
    try {
      const results = await searchInventoryItems(searchQuery);
      setItems(results);
    } catch (error) {
      console.error('Error searching inventory:', error);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setShowModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description || '');
    setItemPrice(item.price.toString());
    setShowModal(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Item name is required');
      return;
    }
    if (!itemPrice || parseFloat(itemPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      if (editingItem) {
        await updateInventoryItem(editingItem.id!, {
          name: itemName.trim(),
          description: itemDescription.trim() || undefined,
          price: parseFloat(itemPrice),
        });
      } else {
        await saveInventoryItem({
          name: itemName.trim(),
          description: itemDescription.trim() || undefined,
          price: parseFloat(itemPrice),
          createdAt: new Date().toISOString(),
        });
      }
      handleCloseModal();
      await loadItems();
      setSearchQuery(''); // Reset search
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInventoryItem(itemId);
              await loadItems();
              setSearchQuery(''); // Reset search
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setItemName('');
    setItemDescription('');
    setItemPrice('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.tabIconDefault, paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Inventory</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
        <IconSymbol size={20} name="magnifyingglass" color={colors.tabIconDefault} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search items (type at least 2 letters)..."
          placeholderTextColor={colors.tabIconDefault}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol size={20} name="xmark.circle.fill" color={colors.tabIconDefault} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>Loading...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery.length >= 2 ? 'No items found' : 'No inventory items yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
              {searchQuery.length >= 2
                ? 'Try a different search term'
                : 'Add items to your inventory to quickly add them to receipts'}
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {items.map((item) => (
              <View
                key={item.id}
                style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}
              >
                <View style={styles.itemCardContent}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                  {item.description && (
                    <Text style={[styles.itemDescription, { color: colors.tabIconDefault }]}>{item.description}</Text>
                  )}
                  <Text style={[styles.itemPrice, { color: colors.tint }]}>{formatCurrency(item.price)}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() => handleEditItem(item)}
                    style={styles.actionButton}
                  >
                    <IconSymbol size={20} name="pencil" color={colors.tint} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => item.id && handleDeleteItem(item.id)}
                    style={styles.actionButton}
                  >
                    <IconSymbol size={20} name="trash.fill" color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <View style={[styles.footer, { borderTopColor: colors.tabIconDefault, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={handleAddItem}
        >
          <IconSymbol size={20} name="plus" color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.tabIconDefault }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingItem ? 'Edit Item' : 'Add Item'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <IconSymbol size={24} name="xmark" color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.text }]}>Item Name *</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
                  placeholder="Enter item name"
                  placeholderTextColor={colors.tabIconDefault}
                  value={itemName}
                  onChangeText={setItemName}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.text }]}>Description (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
                  placeholder="Enter item description"
                  placeholderTextColor={colors.tabIconDefault}
                  value={itemDescription}
                  onChangeText={setItemDescription}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.text }]}>Price *</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.tabIconDefault}
                  keyboardType="decimal-pad"
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  returnKeyType="done"
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.tabIconDefault }]}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}
                onPress={handleCloseModal}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: colors.tint }]}
                onPress={handleSaveItem}
              >
                <Text style={styles.modalSaveText}>{editingItem ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  itemCardContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 400,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    flexShrink: 1,
    flexGrow: 1,
  },
  modalBodyContent: {
    padding: 16,
    paddingBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalTextArea: {
    minHeight: 80,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

