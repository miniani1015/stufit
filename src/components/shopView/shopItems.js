import seagullImg from '../../assets/shop-items/seagull.png';
import parrotImg from '../../assets/shop-items/parrot.png';
import duckImg from '../../assets/shop-items/duck.png';
import slimeUmbrellaImg from '../../assets/shop-items/umbrella-slime.png';
import jellyfishImg from '../../assets/shop-items/jellyfish-green.png';
import pumpkinImg from '../../assets/shop-items/pumpkin.png';
import ghostImg from '../../assets/shop-items/ghost.png';
import toxicSludgeImg from '../../assets/shop-items/toxic-sludge.gif';
import anglerfishImg from '../../assets/shop-items/아귀.png';
import frameVip from '../../assets/shop-items/너는 못 사는 VIP 테두리.png';
import frameStrawberry from '../../assets/shop-items/딸기 테두리.png';
import frameLemon from '../../assets/shop-items/레몬 테두리.png';
import frameMcHat from '../../assets/shop-items/맥도날드 모자 테두리.png';
import frameMcBurger from '../../assets/shop-items/맥도날드 햄버거 테두리.png';
import frameCherryBlossom from '../../assets/shop-items/벚꽃 테두리.png';
import frameSuperstar from '../../assets/shop-items/슈퍼스타 테두리.png';
import frameAvocado from '../../assets/shop-items/아보카도 테두리.png';
import frameChicken from '../../assets/shop-items/치킨 오돌뼈로 태어난 테두리.png';
import bgCloud from '../../assets/shop-items/구름 배경.png';
import bgCurtain from '../../assets/shop-items/라이트블루 커튼 배경.png';
import bgLemon from '../../assets/shop-items/레몬 배경.png';
import bgStage from '../../assets/shop-items/무대 배경.png';
import bgRedStar from '../../assets/shop-items/빨간별 배경.png';
import bgAvocado from '../../assets/shop-items/아보카도 배경.png';
import bgLightGreen from '../../assets/shop-items/연두 배경.png';
import bgThrone from '../../assets/shop-items/왕좌 배경.png';
import bgTeeth from '../../assets/shop-items/이빨 배경.png';
import bgCrescent from '../../assets/shop-items/초승달 배경.png';
import bgPinkDots from '../../assets/shop-items/핑크 점박이 배경.png';
import bgTiger from '../../assets/shop-items/호랑이 배경.png';

export const shopItems = [
    { id: 1, category: '프로필 테두리', name: '너는 못 사는 VIP 테두리', price: '99,999 P', color: '#fff', type: 'frame', image: frameVip },
    { id: 2, category: '프로필 테두리', name: '딸기 테두리', price: '3,000 P', color: '#fff', type: 'frame', image: frameStrawberry },
    { id: 3, category: '프로필 테두리', name: '레몬 테두리', price: '3,000 P', color: '#fff', type: 'frame', image: frameLemon },
    { id: 4, category: '프로필 테두리', name: '맥도날드 모자 테두리', price: '5,000 P', color: '#fff', type: 'frame', image: frameMcHat },
    { id: 5, category: '프로필 테두리', name: '맥도날드 햄버거 테두리', price: '3,000 P', color: '#fff', type: 'frame', image: frameMcBurger },
    { id: 6, category: '프로필 테두리', name: '벚꽃 테두리', price: '3,000 P', color: '#fff', type: 'frame', image: frameCherryBlossom },
    { id: 7, category: '프로필 테두리', name: '슈퍼스타 테두리', price: '50,000 P', color: '#fff', type: 'frame', image: frameSuperstar },
    { id: 8, category: '프로필 테두리', name: '아보카도 테두리', price: '3,000 P', color: '#fff', type: 'frame', image: frameAvocado },
    { id: 9, category: '프로필 테두리', name: '치킨 오돌뼈로 태어난 테두리', price: '5,000 P', color: '#fff', type: 'frame', image: frameChicken },
    { id: 10, category: '프로필 배경', name: '구름 배경', price: '3,000 P', color: '#fff', type: 'bg', image: bgCloud },
    { id: 11, category: '프로필 배경', name: '라이트블루 커튼 배경', price: '3,000 P', color: '#fff', type: 'bg', image: bgCurtain },
    { id: 12, category: '프로필 배경', name: '레몬 배경', price: '3,000 P', color: '#fff', type: 'bg', image: bgLemon },
    { id: 13, category: '프로필 배경', name: '무대 배경', price: '3,000 P', color: '#fff', type: 'bg', image: bgStage },
    { id: 14, category: '프로필 배경', name: '빨간별 배경', price: '3,000 P', color: '#fff', type: 'bg', image: bgRedStar },
    { id: 15, category: '프로필 배경', name: '아보카도 배경', price: '3,000 P', color: '#fff', type: 'bg', image: bgAvocado },
    { id: 16, category: '프로필 배경', name: '연두 배경', price: '3,000 P', color: '#fff', type: 'bg', image: bgLightGreen },
    { id: 17, category: '프로필 배경', name: '왕좌 배경', price: '99,999 P', color: '#fff', type: 'bg', image: bgThrone },
    { id: 18, category: '프로필 배경', name: '이빨 배경', price: '10,000 P', color: '#fff', type: 'bg', image: bgTeeth },
    { id: 19, category: '프로필 배경', name: '초승달 배경', price: '3,000 P', color: '#fff', type: 'bg', image: bgCrescent },
    { id: 20, category: '프로필 배경', name: '핑크 점박이 배경', price: '3,000 P', color: '#fff', type: 'bg', image: bgPinkDots },
    { id: 21, category: '프로필 배경', name: '호랑이 배경', price: '99,999 P', color: '#fff', type: 'bg', image: bgTiger },
    { id: 22, category: '프로필 이미지', name: '갈매기', price: '3,000 P', color: '#ff6347', type: 'image', image: seagullImg },
    { id: 23, category: '프로필 이미지', name: '앵무새', price: '3,000 P', color: '#4169e1', type: 'image', image: parrotImg },
    { id: 24, category: '프로필 이미지', name: '오리', price: '3,000 P', color: '#9370db', type: 'image', image: duckImg },
    { id: 25, category: '프로필 이미지', name: '우산 슬라임', price: '5,000 P', color: '#8b4513', type: 'image', image: slimeUmbrellaImg },
    { id: 26, category: '프로필 이미지', name: '해파리', price: '3,000 P', color: '#fff0f5', type: 'image', image: jellyfishImg },
    { id: 27, category: '프로필 이미지', name: '펌킨', price: '2,000 P', color: '#8b0000', type: 'image', image: pumpkinImg },
    { id: 28, category: '프로필 이미지', name: '유령', price: '4,000 P', color: '#f2f2f2', type: 'image', image: ghostImg },
    { id: 29, category: '프로필 이미지', name: '유독성 슬러지', price: '10,000 P', color: '#a7d46f', type: 'image', image: toxicSludgeImg },
    { id: 30, category: '프로필 이미지', name: '아귀', price: '3,000 P', color: '#a7d46f', type: 'image', image: anglerfishImg },
];

export const frameItems = shopItems.filter((item) => item.type === 'frame');
export const bgItems = shopItems.filter((item) => item.type === 'bg');
export const imageItems = shopItems.filter((item) => item.type === 'image');
