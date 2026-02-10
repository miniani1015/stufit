import { imageItems } from './shopItems';

function ShopProfileImage({ wishlistScope, isWishlisted, isPurchased, toggleWishlist, onPurchase }) {
    const categoryLabel = '프로필 이미지';
    const items = imageItems;

    return (
        <div className="shop-items-grid">
            {items.map((item) => {
                const itemWishlisted = isWishlisted(wishlistScope, item.id);
                const itemPurchased = isPurchased(wishlistScope, item.id);
                const wishlistItem = { ...item, category: categoryLabel };

                return (
                    <div key={item.id} className="shop-item-card">
                    <div
                        className={`item-image ${item.image ? 'has-image' : ''}`}
                        style={{ backgroundColor: item.color }}
                    >
                        {item.image ? (
                            <img className="item-image-img" src={item.image} alt={item.name} />
                        ) : null}
                    </div>
                    <div className="item-details">
                        <div className="item-category">{categoryLabel}</div>
                        <div className="item-name">{item.name}</div>
                        <div className="item-price">{item.price}</div>
                        <div className="item-actions">
                            <button 
                                className={`item-wishlist-btn ${itemWishlisted ? 'wishlisted' : ''}`}
                                onClick={() => toggleWishlist(wishlistScope, wishlistItem)}
                                title="찜하기"
                            >
                                {itemWishlisted ? '♥' : '♡'}
                            </button>
                            <button
                                className={`item-buy-btn ${itemPurchased ? 'purchased' : ''}`}
                                onClick={() => onPurchase(wishlistScope, wishlistItem)}
                                disabled={itemPurchased}
                            >
                                {itemPurchased ? '구매완료' : '구매하기'}
                            </button>
                        </div>
                    </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ShopProfileImage;
