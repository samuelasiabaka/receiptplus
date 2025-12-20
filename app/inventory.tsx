import LoadingView from '@/components/loading-view';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAllInventoryItems, saveInventoryItem, updateInventoryItem, deleteInventoryItem, searchInventoryItems } from '@/lib/storage';
import { initDb } from '@/lib/database';
import type { InventoryItem } from '@/models/types';
import { formatCurrency } from '@/utils/receipt';

// Animated Inventory Card Component
function AnimatedInventoryCard({
  item,
  index,
  colors,
  formatCurrency,
  onEdit,
  onDelete,
}: {
  item: InventoryItem;
  index: number;
  colors: any;
  formatCurrency: (amount: number) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cardAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const opacity = cardAnim;

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <View style={styles.itemCard}>
        <View style={styles.itemCardContent}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
          {item.description && (
            <Text style={[styles.itemDescription, { color: colors.tabIconDefault }]}>{item.description}</Text>
          )}
          <View style={[styles.priceBadge, { backgroundColor: `${colors.tint}15` }]}>
            <Text style={[styles.itemPrice, { color: colors.tint }]}>{formatCurrency(item.price)}</Text>
          </View>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            onPress={onEdit}
            style={[styles.actionButton, { backgroundColor: '#EFF6FF' }]}
            activeOpacity={0.7}
          >
            <IconSymbol size={18} name="pencil" color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            style={[styles.actionButton, { backgroundColor: '#FEF2F2' }]}
            activeOpacity={0.7}
          >
            <IconSymbol size={18} name="trash.fill" color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

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
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
      
      // Animate fade-in
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
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
      <View style={[styles.header, { backgroundColor: '#FFFFFF', borderBottomColor: '#E5E7EB', paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: '#F3F4F6' }]}>
          <IconSymbol size={20} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Inventory</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol size={20} name="magnifyingglass" color="#9CA3AF" />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search items (type at least 2 letters)..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <IconSymbol size={20} name="xmark.circle.fill" color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <LoadingView message="Loading inventory..." />
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
          <Animated.View style={[styles.itemsList, { opacity: fadeAnim }]}>
            {items.map((item, index) => (
              <AnimatedInventoryCard
                key={item.id}
                item={item}
                index={index}
                colors={colors}
                formatCurrency={formatCurrency}
                onEdit={() => handleEditItem(item)}
                onDelete={() => item.id && handleDeleteItem(item.id)}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Add Button */}
      <View style={[styles.footer, { backgroundColor: '#FFFFFF', borderTopColor: '#E5E7EB' }]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddItem}
          activeOpacity={0.8}
        >
          <IconSymbol size={22} name="plus" color="#FFFFFF" />
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
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: '#E5E7EB' }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingItem ? 'Edit Item' : 'Add Item'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal} style={[styles.closeButton, { backgroundColor: '#F3F4F6' }]}>
                <IconSymbol size={20} name="xmark" color={colors.text} />
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
                  style={[styles.modalInput, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: colors.text }]}
                  placeholder="Enter item name"
                  placeholderTextColor="#9CA3AF"
                  value={itemName}
                  onChangeText={setItemName}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.text }]}>Description (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: colors.text }]}
                  placeholder="Enter item description"
                  placeholderTextColor="#9CA3AF"
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
                  style={[styles.modalInput, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  returnKeyType="done"
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' }]}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
                onPress={handleCloseModal}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveItem}
                activeOpacity={0.8}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  itemsList: {
    gap: 16,
  },
  itemCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  itemCardContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
    color: '#6B7280',
  },
  priceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 14,
    gap: 10,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 400,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flexShrink: 1,
    flexGrow: 1,
  },
  modalBodyContent: {
    padding: 20,
    paddingBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

