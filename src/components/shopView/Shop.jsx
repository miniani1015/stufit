import { useEffect, useState } from 'react';
import ShopAll from './ShopAll';
import ShopProfileFrame from './ShopProfileFrame';
import ShopProfileBG from './ShopProfileBG';
import ShopProfileImage from './ShopProfileImage';
import ShopWishlist from './ShopWishlist';
import { bgItems, frameItems, imageItems, shopItems } from './shopItems';
import ShopSidebar from './ShopSidebar';
import CustomAlertModal from '../modal/CustomAlertModal';
import '../shopView/Shop.css';

function Shop() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [wishlistItemsByKey, setWishlistItemsByKey] = useState({});
    const [purchasedItemsByKey, setPurchasedItemsByKey] = useState(() => {
        const stored = localStorage.getItem('purchasedItems');
        if (!stored) {
            return {};
        }

        try {
            const parsed = JSON.parse(stored);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    });
    const [points, setPoints] = useState(null);
    const [pointsError, setPointsError] = useState('');
    const [alertModal, setAlertModal] = useState({ show: false, message: '' });
    const [userId, setUserId] = useState(() => localStorage.getItem('userId'));
    const [username, setUsername] = useState(() => localStorage.getItem('username'));
    const [isLoggedIn, setIsLoggedIn] = useState(
        Boolean(localStorage.getItem('username') || localStorage.getItem('userId'))
    );

    const buildWishlistKey = (scope, id) => `${scope}:${id}`;
    const isLoggedInMessage = isLoggedIn ? '' : '로그인 후 이용해주세요.';

    const parsePrice = (price) => {
        if (!price) {
            return 0;
        }

        const numeric = String(price).replace(/[^0-9]/g, '');
        return Number(numeric) || 0;
    };

    const formatPoints = (value) => {
        if (typeof value !== 'number') {
            return '-';
        }

        return `${value.toLocaleString('ko-KR')} P`;
    };

    const toggleWishlist = (scope, item) => {
        const wishlistKey = buildWishlistKey(scope, item.id);

        setWishlistItemsByKey((prev) => {
            if (prev[wishlistKey]) {
                const next = { ...prev };
                delete next[wishlistKey];
                return next;
            }

            return {
                ...prev,
                [wishlistKey]: { ...item, _wishlistKey: wishlistKey },
            };
        });
    };

    const removeFromWishlist = (wishlistKey) => {
        if (!wishlistKey) {
            return;
        }

        setWishlistItemsByKey((prev) => {
            if (!prev[wishlistKey]) {
                return prev;
            }

            const next = { ...prev };
            delete next[wishlistKey];
            return next;
        });
    };

    const isWishlisted = (scope, id) => Boolean(wishlistItemsByKey[buildWishlistKey(scope, id)]);
    const isPurchased = (itemKey) => Boolean(purchasedItemsByKey[itemKey]);
    const isPurchasedByScope = (scope, id) => isPurchased(buildWishlistKey(scope, id));
    const wishlistItems = Object.values(wishlistItemsByKey);

    const openAlert = (message) => {
        setAlertModal({ show: true, message });
    };

    const markPurchased = (itemKey) => {
        if (!itemKey) {
            return;
        }

        setPurchasedItemsByKey((prev) => {
            const next = { ...prev, [itemKey]: true };
            localStorage.setItem('purchasedItems', JSON.stringify(next));
            return next;
        });
    };

    const handlePurchase = async (scope, item) => {
        const currentUsername = localStorage.getItem('username');
        const currentUserId = localStorage.getItem('userId');
        const loggedInNow = Boolean(currentUsername || currentUserId);

        if (!loggedInNow) {
            openAlert('로그인 후 이용해주세요.');
            return;
        }

        if (currentUserId && currentUserId !== userId) {
            setUserId(currentUserId);
        }

        if (currentUsername && currentUsername !== username) {
            setUsername(currentUsername);
        }

        let resolvedUserId = currentUserId || userId;
        if (!resolvedUserId && currentUsername) {
            try {
                const response = await fetch(`/api/user/resolve?username=${encodeURIComponent(currentUsername)}`);
                const data = await response.json();

                if (response.ok && data?.userId) {
                    resolvedUserId = String(data.userId);
                    localStorage.setItem('userId', resolvedUserId);
                    setUserId(resolvedUserId);
                }
            } catch (err) {
                console.error('Resolve userId error:', err);
            }
        }

        if (!resolvedUserId) {
            openAlert('로그인 정보를 확인 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        const price = parsePrice(item?.price);
        if (!price) {
            openAlert('가격 정보가 올바르지 않습니다.');
            return;
        }

        try {
                const response = await fetch('/api/shop/purchase', {
                method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Username': currentUsername || '',
                    },
                body: JSON.stringify({ userId: Number(resolvedUserId), price, itemName: item?.name }),
            });

            const data = await response.json();

            if (!response.ok) {
                openAlert(data?.message || '구매에 실패했습니다.');
                return;
            }

            const nextPoints = Number(data?.points);
            if (!Number.isNaN(nextPoints)) {
                setPoints(nextPoints);
                localStorage.setItem('points', String(nextPoints));
                window.dispatchEvent(new CustomEvent('pointsUpdated', { detail: { points: nextPoints } }));
            }

            const purchaseKey = item?._wishlistKey
                ?? (scope
                    ? buildWishlistKey(scope, item?.id)
                    : buildWishlistKey(item?.type || 'item', item?.id));
            markPurchased(purchaseKey);

            const wishlistKey = item?._wishlistKey ?? buildWishlistKey(scope, item?.id);
            removeFromWishlist(wishlistKey);

            openAlert('구매가 완료되었습니다!');
        } catch (err) {
            console.error('Purchase error:', err);
            openAlert('구매 처리 중 오류가 발생했습니다.');
        }
    };

    const itemCounts = {
        all: shopItems.length,
        frame: frameItems.length,
        bg: bgItems.length,
        image: imageItems.length,
        cart: wishlistItems.length,
    };

    useEffect(() => {
        const fetchPoints = async () => {
            if (!isLoggedIn) {
                setPoints(0);
                return;
            }

            if (!userId) {
                return;
            }

            try {
                    const currentUsername = localStorage.getItem('username');
                    const response = await fetch(`/api/user/points?userId=${userId}`, {
                        headers: { 'X-Username': currentUsername || '' },
                    });
                const data = await response.json();

                if (!response.ok) {
                    setPointsError(data?.message || '포인트를 불러오지 못했습니다.');
                    setPoints(0);
                    return;
                }

                const nextPoints = Number(data?.points) || 0;
                setPoints(nextPoints);
                localStorage.setItem('points', String(nextPoints));
                setPointsError('');
            } catch (err) {
                console.error('Points fetch error:', err);
                setPointsError('포인트를 불러오지 못했습니다.');
                setPoints(0);
            }
        };

        fetchPoints();
    }, [isLoggedIn, userId]);

    useEffect(() => {
        const syncAuthState = () => {
            const nextUsername = localStorage.getItem('username');
            const nextUserId = localStorage.getItem('userId');
            setUsername(nextUsername);
            setUserId(nextUserId);
            setIsLoggedIn(Boolean(nextUsername || nextUserId));
        };

        syncAuthState();
        window.addEventListener('loginStatusChanged', syncAuthState);
        window.addEventListener('storage', syncAuthState);
        return () => {
            window.removeEventListener('loginStatusChanged', syncAuthState);
            window.removeEventListener('storage', syncAuthState);
        };
    }, []);

    useEffect(() => {
        const resolveUserId = async () => {
            if (!username || userId) {
                return;
            }

            try {
                const response = await fetch(`/api/user/resolve?username=${encodeURIComponent(username)}`, {
                    headers: { 'X-Username': username || '' },
                });
                const data = await response.json();

                if (!response.ok) {
                    return;
                }

                const resolvedUserId = data?.userId ? String(data.userId) : null;
                if (resolvedUserId) {
                    localStorage.setItem('userId', resolvedUserId);
                    setUserId(resolvedUserId);
                }
            } catch (err) {
                console.error('Resolve userId error:', err);
            }
        };

        resolveUserId();
    }, [username, userId]);

    const renderContent = () => {
        switch (activeCategory) {
            case 'all':
                return (
                    <ShopAll
                        wishlistScope="all"
                        isWishlisted={isWishlisted}
                        isPurchased={isPurchasedByScope}
                        toggleWishlist={toggleWishlist}
                        onPurchase={handlePurchase}
                    />
                );
            case 'frame':
                return (
                    <ShopProfileFrame
                        wishlistScope="frame"
                        isWishlisted={isWishlisted}
                        isPurchased={isPurchasedByScope}
                        toggleWishlist={toggleWishlist}
                        onPurchase={handlePurchase}
                    />
                );
            case 'bg':
                return (
                    <ShopProfileBG
                        wishlistScope="bg"
                        isWishlisted={isWishlisted}
                        isPurchased={isPurchasedByScope}
                        toggleWishlist={toggleWishlist}
                        onPurchase={handlePurchase}
                    />
                );
            case 'image':
                return (
                    <ShopProfileImage
                        wishlistScope="image"
                        isWishlisted={isWishlisted}
                        isPurchased={isPurchasedByScope}
                        toggleWishlist={toggleWishlist}
                        onPurchase={handlePurchase}
                    />
                );
            case 'cart':
                return (
                    <ShopWishlist
                        wishlistItems={wishlistItems}
                        onRemove={removeFromWishlist}
                        isPurchased={isPurchased}
                        onPurchase={handlePurchase}
                    />
                );
            default:
                return (
                    <ShopAll
                        wishlistScope="all"
                        isWishlisted={isWishlisted}
                        isPurchased={isPurchasedByScope}
                        toggleWishlist={toggleWishlist}
                        onPurchase={handlePurchase}
                    />
                );
        }
    };

    return (
        <div className="shop-container">
            {/* 왼쪽 사이드바 */}
            <ShopSidebar activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

            {/* 오른쪽 콘텐츠 */}
            <div className="shop-main">
                <div className="shop-count-row">
                    <div className="shop-count">
                        <span className="shop-count-number">{itemCounts[activeCategory] ?? 0}</span> 항목이 있어요
                    </div>
                    <div className="shop-points" title={pointsError || ''}>
                        <span className="shop-points-label">나의 보유 포인트</span>
                        <span className="shop-points-value">{formatPoints(points)}</span>
                    </div>
                </div>
                {renderContent()}
            </div>
            {alertModal.show && (
                <CustomAlertModal
                    message={alertModal.message}
                    onClose={() => setAlertModal({ show: false, message: '' })}
                />
            )}
        </div>
    );
}

export default Shop;