import { useState, useEffect } from "react";
import GiveUpModal from "./modal/GiveUpModal";
import FinalGiveUpModal from "./modal/FinalGiveUpModal";
import CustomAlertModal from "./modal/CustomAlertModal";

function ChallengeDetailView({ challenge, onClose }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [finalModalOpen, setFinalModalOpen] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);
    const [submittedToday, setSubmittedToday] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [elapsedDays, setElapsedDays] = useState(0);
    const [remainingDays, setRemainingDays] = useState(0);
    const [alertMessage, setAlertMessage] = useState('');
    const [miniGameOpen, setMiniGameOpen] = useState(false);
    const [miniGameMessage, setMiniGameMessage] = useState('공동 1등이 발생했어요. 미니게임으로 최종 1등을 결정합니다!');
    const [pendingBetScore, setPendingBetScore] = useState(0);

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => document.body.classList.remove('modal-open');
    }, []);

    // 타이머 초기화
    useEffect(() => {
        if (challenge?.timer_hours || challenge?.timer_minutes) {
            const totalSeconds = (challenge.timer_hours || 0) * 3600 + (challenge.timer_minutes || 0) * 60;
            setTimerSeconds(totalSeconds);
        }
    }, [challenge]);

    // 타이머 시작/종료
    useEffect(() => {
        let interval;
        if (isTimerRunning && timerSeconds > 0) {
            interval = setInterval(() => {
                setTimerSeconds(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timerSeconds]);

    const getTotalDays = () => {
        if (!challenge?.category) return null;
        const categoryDays = {
            DAILY: 30,
            SHORT: 20
        };

        return categoryDays[challenge.category] || 30;
    };

    const loadProgress = async () => {
        const username = localStorage.getItem('username');
        if (!username || !challenge?.challenge_id) {
            setProgressPercent(0);
            setSubmittedToday(false);
            return;
        }

        try {
            const response = await fetch(`/api/challenges/${challenge.challenge_id}/progress`, {
                headers: { 'X-Username': username }
            });

            if (!response.ok) {
                return;
            }

            const result = await response.json();
            const rows = Array.isArray(result?.data) ? result.data : [];
            const userRows = rows.filter(row => row.username === username);
            const count = userRows.length;
            const today = new Date().toISOString().slice(0, 10);
                const totalDays = getTotalDays();
                const total = totalDays || 0;
                const elapsed = Math.min(count, total);

                if (total <= 0) {
                    setProgressPercent(0);
                    setElapsedDays(0);
                    setRemainingDays(0);
                } else {
                    setProgressPercent(Math.min((elapsed / total) * 100, 100));
                    setElapsedDays(elapsed);
                    setRemainingDays(Math.max(total - elapsed, 0));
                }

                setSubmittedToday(userRows.some(row => row.date === today));
        } catch (error) {
            console.error('진행도 조회 오류:', error);
        }
    };

    // 진행도 로드 (오늘 제출 여부 포함)
    useEffect(() => {
        loadProgress();
    }, [challenge]);

    const giveupHandler = () => setModalOpen(true);

    const handleSubmitProgress = async () => {
        if (submitLoading) return;

        if (submittedToday) {
            alert('오늘은 이미 제출했습니다.');
            return;
        }

        const username = localStorage.getItem('username');
        if (!username || !challenge?.challenge_id) {
            alert('로그인이 필요합니다.');
            return;
        }

        setSubmitLoading(true);
        try {
            const response = await fetch(`/api/challenges/${challenge.challenge_id}/verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Username': username
                }
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result?.message || '제출에 실패했습니다.');
                return;
            }

            await loadProgress();
        } catch (error) {
            console.error('제출 오류:', error);
            alert('제출 중 오류가 발생했습니다.');
        } finally {
            setSubmitLoading(false);
        }
    };

    // 챌린지 나가기 성공 시 호출
    const handleLeaveSuccess = () => {
        setFinalModalOpen(false);
        setAlertMessage("챌린지를 완전히 포기했습니다.");
        setAlertOpen(true);
    };

    const getProgressRanking = async () => {
        const username = localStorage.getItem('username');
        if (!username || !challenge?.challenge_id) {
            return { username: null, topUsers: [], topScore: 0 };
        }

        const response = await fetch(`/api/challenges/${challenge.challenge_id}/progress`, {
            headers: { 'X-Username': username }
        });

        if (!response.ok) {
            return { username, topUsers: [], topScore: 0 };
        }

        const result = await response.json();
        const rows = Array.isArray(result?.data) ? result.data : [];
        const scoreByUser = rows.reduce((acc, row) => {
            const key = row?.username;
            if (!key) return acc;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const ranking = Object.entries(scoreByUser)
            .map(([name, score]) => ({ name, score }))
            .sort((a, b) => b.score - a.score);

        if (ranking.length === 0) {
            return { username, topUsers: [], topScore: 0 };
        }

        const topScore = ranking[0].score;
        const topUsers = ranking
            .filter((item) => item.score === topScore)
            .map((item) => item.name);

        return { username, topUsers, topScore };
    };

    const handleCompleteChallenge = async () => {
        try {
            const rawBetInput = window.prompt('베팅 점수를 입력하세요. (미베팅은 0)', '0');
            const parsedBet = Math.max(0, Number(rawBetInput ?? 0) || 0);
            setPendingBetScore(parsedBet);

            const { username, topUsers } = await getProgressRanking();
            const isTieForFirst = topUsers.length >= 2;
            const isCurrentUserInTopTie = Boolean(username && topUsers.includes(username));

            if (isTieForFirst && isCurrentUserInTopTie) {
                setMiniGameMessage(`공동 1등 (${topUsers.join(', ')}) 입니다. 미니게임으로 최종 순위를 결정하세요!`);
                setMiniGameOpen(true);
                return;
            }

            await settleChallenge(parsedBet, false);
        } catch (error) {
            console.error('챌린지 종료 처리 오류:', error);
            setAlertMessage('챌린지 종료 처리 중 오류가 발생했습니다.');
            setAlertOpen(true);
        }
    };

    const settleChallenge = async (betScore, tieBreakerWinner) => {
        const username = localStorage.getItem('username');
        if (!username || !challenge?.challenge_id) {
            setAlertMessage('로그인이 필요합니다.');
            setAlertOpen(true);
            return;
        }

        const response = await fetch(`/api/challenges/${challenge.challenge_id}/finalize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Username': username
            },
            body: JSON.stringify({ betScore, tieBreakerWinner })
        });

        const payload = await response.json();
        if (!response.ok || !payload?.success) {
            setAlertMessage(payload?.message || '종료 정산에 실패했습니다.');
            setAlertOpen(true);
            return;
        }

        const data = payload?.data || {};
        const scoreReward = Number(data?.scoreReward) || 0;
        const pointReward = Number(data?.pointReward) || 0;
        const rank = Number(data?.rank) || 0;

        if (typeof data?.points === 'number') {
            localStorage.setItem('points', String(data.points));
            window.dispatchEvent(new CustomEvent('pointsUpdated', { detail: { points: data.points } }));
        }

        if (scoreReward > 0) {
            setAlertMessage(`정산 완료! ${rank}등 보상으로 +${pointReward}P, 베팅 몰빵 점수 +${scoreReward}점 획득`);
        } else {
            setAlertMessage(`정산 완료! ${rank}등 보상으로 +${pointReward}P 획득 (점수 보상 없음)`);
        }
        setAlertOpen(true);
    };

    const resolveMiniGame = (userPick) => {
        const options = ['가위', '바위', '보'];
        const computerPick = options[Math.floor(Math.random() * options.length)];

        const userIndex = options.indexOf(userPick);
        const computerIndex = options.indexOf(computerPick);

        if (userIndex === computerIndex) {
            setMiniGameMessage(`무승부! (${userPick} vs ${computerPick}) 다시 선택해주세요.`);
            return;
        }

        const userWin =
            (userPick === '가위' && computerPick === '보') ||
            (userPick === '바위' && computerPick === '가위') ||
            (userPick === '보' && computerPick === '바위');

        setMiniGameOpen(false);
        settleChallenge(pendingBetScore, userWin);
    };

    // Props 기본값 설정
    const title = challenge?.title || '챌린지';
    const goal = challenge?.goal || '아침 6시 기상';
    const category = challenge?.category || '';

    const [members, setMembers] = useState([]);

    // 챌린지 멤버 목록 로드
    useEffect(() => {
        const loadMembers = async () => {
            if (!challenge?.challenge_id) return;
            try {
                const username = localStorage.getItem('username');
                const headers = {};
                if (username) headers['X-Username'] = username;

                const res = await fetch(`/api/challenges/${challenge.challenge_id}`, { headers });
                if (!res.ok) return;
                const payload = await res.json();
                const data = payload?.data || {};
                setMembers(Array.isArray(data.members) ? data.members : []);
            } catch (e) {
                console.error('멤버 목록 로드 실패:', e);
            }
        };

        loadMembers();
        const handler = (e) => {
            try {
                if (e?.detail?.challengeId === challenge?.challenge_id) {
                    setMembers(Array.isArray(e.detail.members) ? e.detail.members : members);
                }
            } catch (err) { /* ignore */ }
        };
        window.addEventListener('challenge-joined', handler);
        return () => window.removeEventListener('challenge-joined', handler);
    }, [challenge]);

    // 카테고리 한글 변환
    const getCategoryName = (cat) => {
        const categoryMap = {
            'STUDY': '공부',
            'EXERCISE': '운동',
            'DAILY': '일상'
        };
        return categoryMap[cat] || cat;
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    // 타이머 포맷팅 (HH:MM:SS)
    const formatTimer = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <>
            <div id="challenge-detail-view" className="modal">
                <div className="detail-view-container">
                    <div className="detail-sidebar">
                        <h2>MEMBER</h2>
                        <div className="member-list">
                            {members.length === 0 ? (
                                <div className="member-item empty">참여자가 없습니다.</div>
                            ) : (
                                members.map((m) => (
                                    <div key={m.user_id} className="member-item">
                                        <div className="member-avatar">
                                            <img src="/img/Profile.png" alt="Profile" />
                                        </div>
                                        <span className="member-name">{m.username}</span>
                                        <span className={`member-status ${m.status || 'not_submitted'}`} style={{ marginLeft: '8px', fontSize: '0.85rem', color: '#666' }}>
                                            {m.status === 'submitted' ? '제출' : m.status === 'checked' ? '인증' : '미제출'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>


                    <div className="detail-main">
                        <button className="close-detail-btn" onClick={onClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        <div className="detail-card">
                            <h3 className="detail-title-left">챌린지 진행도</h3>
                            <div className="progress-area">
                                <div className="progress-info">
                                    <span className="days-elapsed">{elapsedDays}일 경과</span>
                                    <span className="percentage">{Math.round(progressPercent)}%</span>
                                    <span className="days-left">{remainingDays}일 남음</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                            </div>
                        </div>


                        <div className="detail-card">
                            <h3 className="detail-title-left">챌린지 목표</h3>
                            <div className="goal-box">{goal}</div>
                            <button
                                className="submit-btn"
                                onClick={handleSubmitProgress}
                                disabled={submittedToday || submitLoading}
                            >
                                {submittedToday ? '오늘 제출 완료' : submitLoading ? '제출 중...' : '제출하기'}
                            </button>
                        </div>


                        <div className="detail-card status-card">
                            {(category === 'STUDY' || category === 'EXERCISE') ? (
                                <>
                                    <h3 className="detail-title-left">타이머</h3>
                                    <div className="timer-display">
                                        <div className="timer-time">{formatTimer(timerSeconds)}</div>
                                        <div className="timer-controls">
                                            <button 
                                                className="timer-btn"
                                                onClick={() => setIsTimerRunning(!isTimerRunning)}
                                            >
                                                {isTimerRunning ? '⏸ 일시정지' : '▶ 시작'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3>참여 현황</h3>
                                    <div className="status-grid">
                                        <div className="status-item">
                                            <div className="status-user">
                                                <div className="status-avatar">
                                                    <img src="img/Profile.png" alt="Profile" />
                                                </div>
                                                <span>김예선</span>
                                            </div>
                                            <span className="status-label success">인증 완료</span>
                                        </div>
                                        <div className="status-item">
                                            <div className="status-user">
                                                <div className="status-avatar">
                                                    <img src="img/Profile.png" alt="Profile" />
                                                </div>
                                                <span>이정민</span>
                                            </div>
                                            <span className="status-label danger">미제출</span>
                                        </div>
                                        <div className="status-item">
                                            <div className="status-user">
                                                <div className="status-avatar">
                                                    <img src="img/Profile.png" alt="Profile" />
                                                </div>
                                                <span>이정민</span>
                                            </div>
                                            <span className="status-label danger">미제출</span>
                                        </div>

                                        <div className="status-item">
                                            <div className="status-user">
                                                <div className="status-avatar">
                                                    <img src="img/Profile.png" alt="Profile" />
                                                </div>
                                                <span>유태민</span>
                                            </div>
                                            <span className="status-label success">인증 완료</span>
                                        </div>
                                        <div className="status-item">
                                            <div className="status-user">
                                                <div className="status-avatar">
                                                    <img src="img/Profile.png" alt="Profile" />
                                                </div>
                                                <span>박현서</span>
                                            </div>
                                            <span className="status-label warning">인증 실패</span>
                                        </div>
                                        <div className="status-item">
                                            <div className="status-user">
                                                <div className="status-avatar">
                                                    <img src="img/Profile.png" alt="Profile" />
                                                </div>
                                                <span>박현서</span>
                                            </div>
                                            <span className="status-label warning">인증 실패</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="detail-actions">
                            <button className="btn-giveup" onClick={giveupHandler}>give up</button>
                            <button className="btn-complete" onClick={handleCompleteChallenge}>complete</button>
                        </div>
                    </div>
                </div>
            </div>

            {modalOpen && <GiveUpModal setModalOpen={setModalOpen} setFinalModalOpen={setFinalModalOpen} />}
            {finalModalOpen && (
                <FinalGiveUpModal
                    setModalOpen={setFinalModalOpen}
                    challengeId={challenge?.challenge_id}
                    onLeave={handleLeaveSuccess}
                />
            )}
            {alertOpen && (
                <CustomAlertModal
                    message={alertMessage || "알림입니다."}
                    onClose={() => {
                        setAlertOpen(false);
                        if (onClose) {
                            onClose();
                        }
                    }}
                />
            )}
            {miniGameOpen && (
                <div className="popup-modal" style={{ zIndex: 1200 }}>
                    <div className="popup-overlay" onClick={() => setMiniGameOpen(false)}></div>
                    <div className="popup-content" style={{ maxWidth: '520px', textAlign: 'center' }}>
                        <h2>공동 1등 미니게임</h2>
                        <p style={{ color: '#555', marginBottom: '20px' }}>{miniGameMessage}</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button className="start-challenge-btn" onClick={() => resolveMiniGame('가위')}>가위</button>
                            <button className="start-challenge-btn" onClick={() => resolveMiniGame('바위')}>바위</button>
                            <button className="start-challenge-btn" onClick={() => resolveMiniGame('보')}>보</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
export default ChallengeDetailView;