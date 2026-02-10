import { useEffect, useMemo, useState } from 'react';
import ItemDetailModal from './modal/ItemDetailModal';
import './shopView/Shop.css';
import { shopItems } from './shopView/shopItems';

function MyItems() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [purchasedKeys, setPurchasedKeys] = useState(() => {
    try {
      const stored = localStorage.getItem('purchasedItems');
      const parsed = stored ? JSON.parse(stored) : {};
      return parsed && typeof parsed === 'object' ? Object.keys(parsed) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const syncPurchasedItems = () => {
      try {
        const stored = localStorage.getItem('purchasedItems');
        const parsed = stored ? JSON.parse(stored) : {};
        const keys = parsed && typeof parsed === 'object' ? Object.keys(parsed) : [];
        setPurchasedKeys(keys);
      } catch {
        setPurchasedKeys([]);
      }
    };

    syncPurchasedItems();
    window.addEventListener('storage', syncPurchasedItems);
    return () => window.removeEventListener('storage', syncPurchasedItems);
  }, []);

  const ownedItems = useMemo(() => {
    const purchasedIds = new Set(
      purchasedKeys
        .map((key) => {
          const parts = String(key).split(':');
          const idPart = parts[parts.length - 1];
          const parsedId = Number(idPart);
          return Number.isNaN(parsedId) ? null : parsedId;
        })
        .filter((value) => value !== null)
    );

    return shopItems
      .filter((item) => purchasedIds.has(item.id))
      .map((item) => ({
        ...item,
        isUsing: false,
        isPurchased: true,
      }));
  }, [purchasedKeys]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsItemDetailOpen(true);
  };

  const getFilteredItems = () => {
    if (activeCategory === 'all') return ownedItems;
    return ownedItems.filter(item => item.type === activeCategory);
  };

  const filteredItems = getFilteredItems();

  const categories = [
    { id: 'all', label: '전체' },
    { id: 'frame', label: '프로필 테두리' },
    { id: 'bg', label: '프로필 배경' },
    { id: 'image', label: '프로필 이미지' },
  ];

  return (
    <div className="shop-container">
      {/* 왼쪽 사이드바 */}
      <div className="shop-sidebar">
        <div className="sidebar-menu">
          <div className="menu-header">My Item</div>
          {categories.map((category) => (
            <div
              key={category.id}
              className={`menu-item ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setActiveCategory(category.id); }}
            >
              <span>{category.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 콘텐츠 */}
      <div className="shop-main">
        <div className="shop-count">
          <span className="shop-count-number">{filteredItems.length}</span> 항목이 있어요
        </div>

        <div className="shop-items-grid">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="shop-item-card"
              onClick={() => handleItemClick(item)}
            >
              {item.isUsing && (
                <div className="item-using-badge">사용중</div>
              )}
              <div 
                className={`item-image ${item.type === 'bg' ? 'is-bg' : ''}`}
                style={{ backgroundColor: item.color }}
              >
                {item.image && (
                  <img className="item-image-img" src={item.image} alt={item.name} />
                )}
              </div>
              <div className="item-details">
                <div className="item-category">{item.category}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-price">{item.price}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        <div className="pagination">
          <button className="pagination-btn">&lt;</button>
          <button className="pagination-btn active">1</button>
          <button className="pagination-btn">&gt;</button>
        </div>
      </div>

      <ItemDetailModal 
        isOpen={isItemDetailOpen}
        onClose={() => setIsItemDetailOpen(false)}
        item={selectedItem}
      />
    </div>
  );
}

export default MyItems;
