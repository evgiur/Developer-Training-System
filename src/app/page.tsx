'use client';

import React, { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'skills' | 'middle-gate'>('overview');
  const [skills, setSkills] = useState<any[]>([]);
  const [overallReadiness, setOverallReadiness] = useState(76);
  const [isMiddleReady, setIsMiddleReady] = useState(false);
  const [blockers, setBlockers] = useState<any[]>([]);

  // Daily session state
  const [dailyItems, setDailyItems] = useState<any[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userResponseText, setUserResponseText] = useState('');
  const [gradingResult, setGradingResult] = useState<any>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [usedAiGrading, setUsedAiGrading] = useState(false);

  useEffect(() => {
    fetchSkills();
    fetchDailySession();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills');
      const data = await res.json();
      if (data.success) {
        setSkills(data.skills);
        setOverallReadiness(data.overallReadiness);
        setIsMiddleReady(data.isMiddleReady);
        setBlockers(data.blockers);
      }
    } catch (e) {
      console.error('Failed to fetch skills', e);
    }
  };

  const fetchDailySession = async () => {
    try {
      const res = await fetch('/api/daily-session');
      const data = await res.json();
      if (data.success && data.items) {
        setDailyItems(data.items);
      }
    } catch (e) {
      console.error('Failed to fetch daily session', e);
    }
  };

  const handleGradeWithAI = async () => {
    const currentItem = dailyItems[currentItemIndex];
    // T8: For coding tasks, use solutionCode as reference instead of description
    const task = currentItem?.task;
    const referenceAnswer = currentItem?.question?.referenceAnswer
      || (task?.type === 'CODING' ? task?.solutionCode : task?.description)
      || task?.description
      || 'Standard answer';

    // T4: Mark that AI grading was used for this item
    setUsedAiGrading(true);
    
    setIsGrading(true);
    try {
      const res = await fetch('/api/ai/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswer: userResponseText,
          referenceAnswer,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGradingResult(data.grading);
      }
    } catch (e) {
      console.error('Grading error', e);
    } finally {
      setIsGrading(false);
    }
  };

  const handleSubmitQuality = async (quality: number) => {
    const currentItem = dailyItems[currentItemIndex];
    if (!currentItem) return;

    try {
      await fetch('/api/daily-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user-1',
          reviewItemId: currentItem.id,
          quality,
          response: userResponseText || 'Manual response',
          isAiAssisted: usedAiGrading, // T4: Track AI dependency
        }),
      });

      // Move to next item
      setShowAnswer(false);
      setUserResponseText('');
      setGradingResult(null);
      setUsedAiGrading(false); // T4: Reset AI grading flag for next card
      if (currentItemIndex < dailyItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
      } else {
        alert('🎉 Дневная сессия успешно завершена!');
        fetchDailySession();
        fetchSkills();
      }
    } catch (e) {
      console.error('Failed to submit quality', e);
    }
  };

  const currentItem = dailyItems[currentItemIndex];

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Developer Training System <span className="gradient-text">(DTS)</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Персональная адаптивная система ежедневной подготовки к позиции Middle Full-stack Developer
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            AI Gateway: Active
          </div>
          <div className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium">
            DB: SQLite (dev.db)
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex space-x-2 border-b border-gray-800/80">
        {[
          { id: 'overview', label: '📊 Главная' },
          { id: 'daily', label: '📅 Дневная сессия' },
          { id: 'skills', label: '🧠 Карта навыков' },
          { id: 'middle-gate', label: '🎯 Middle Gate' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl glass-card-hover">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Общий Readiness</div>
          <div className="text-3xl font-extrabold gradient-text mt-2">{overallReadiness}%</div>
          <div className="text-xs text-gray-400 mt-1">Порог Middle: 80%</div>
        </div>

        <div className="glass-card p-5 rounded-2xl glass-card-hover">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Retention Rate</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">85%</div>
          <div className="text-xs text-gray-400 mt-1">Интервальный повтор (SM-2)</div>
        </div>

        <div className="glass-card p-5 rounded-2xl glass-card-hover">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Independent Coding</div>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2">72%</div>
          <div className="text-xs text-gray-400 mt-1">Задачи без помощи AI</div>
        </div>

        <div className="glass-card p-5 rounded-2xl glass-card-hover">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Middle Gate Status</div>
          <div className={`text-xl font-bold mt-2 flex items-center gap-2 ${isMiddleReady ? 'text-emerald-400' : 'text-amber-400'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isMiddleReady ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            {isMiddleReady ? 'READY FOR INTERVIEWS' : 'NOT READY'}
          </div>
          <div className="text-xs text-amber-300/80 mt-1">
            {blockers.length > 0 ? `Блокер: ${blockers[0]?.name}` : 'Все пороги пройдены'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Skill Matrix */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-gray-100 mb-4 flex items-center justify-between">
                <span>Матрица компетенций (Skill Graph)</span>
                <span className="text-xs text-gray-400 font-normal">{skills.length} доменов</span>
              </h2>

              <div className="space-y-4">
                {skills.map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-300 flex items-center gap-2">
                        {item.name}
                        {item.isBlocker && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950 text-red-400 border border-red-800">
                            БЛОКЕР
                          </span>
                        )}
                      </span>
                      <span className="text-gray-400">
                        {item.score}% / Порог: {item.threshold}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.score >= item.threshold
                            ? 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                            : 'bg-gradient-to-r from-amber-500 to-red-500'
                        }`}
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Daily Active Plan */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-indigo-500/20">
              <h2 className="text-lg font-bold text-gray-100 mb-2">План на сегодня</h2>
              <p className="text-xs text-gray-400 mb-4">Сформирован алгоритмом на основе карточек в очереди</p>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 text-sm">🔄</div>
                  <div>
                    <div className="text-sm font-semibold text-gray-200">
                      {dailyItems.length} Карточек в очереди
                    </div>
                    <div className="text-xs text-gray-400">Recall + Coding + Explanation</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('daily')}
                className="w-full mt-5 py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-95 transition-opacity shadow-lg shadow-indigo-500/20"
              >
                Открыть тренажер сессии
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Runner Tab */}
      {activeTab === 'daily' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {currentItem ? (
            <div className="glass-card p-8 rounded-3xl space-y-6">
              <div className="flex justify-between items-center text-xs text-gray-400 border-b border-gray-800 pb-4">
                <span>Карточка {currentItemIndex + 1} из {dailyItems.length}</span>
                <span className="px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 font-semibold border border-indigo-800">
                  {currentItem.question?.topic?.skill?.domain || currentItem.task?.skill?.domain || 'General'}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-100">
                  {currentItem.question?.title || currentItem.task?.title}
                </h3>
                <p className="text-sm text-gray-300 mt-2">
                  {currentItem.question?.content || currentItem.task?.description}
                </p>
              </div>

              {/* Response input */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-semibold uppercase">Ваш ответ:</label>
                <textarea
                  rows={4}
                  value={userResponseText}
                  onChange={(e) => setUserResponseText(e.target.value)}
                  placeholder="Введите ваш ответ или код здесь..."
                  className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold transition-colors"
                >
                  {showAnswer ? 'Скрыть этапное решение' : 'Показать эталонный ответ'}
                </button>

                <button
                  onClick={handleGradeWithAI}
                  disabled={isGrading || !userResponseText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {isGrading ? 'Оценка AI...' : '🤖 Оценить через AI Gateway'}
                </button>
              </div>

              {/* Reference Answer */}
              {showAnswer && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-sm space-y-1">
                  <div className="font-semibold text-xs text-emerald-400 uppercase">Эталонное решение:</div>
                  <div>{currentItem.question?.referenceAnswer || currentItem.task?.solutionCode || 'Отсутствует'}</div>
                </div>
              )}

              {/* AI Grading result */}
              {gradingResult && (
                <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 space-y-3">
                  <div className="text-sm font-bold text-indigo-300 flex justify-between">
                    <span>Оценка AI (Качество: {gradingResult.qualityScore}/4)</span>
                    <span>Правильность: {gradingResult.correctness}%</span>
                  </div>
                  <p className="text-xs text-gray-300">{gradingResult.feedback}</p>
                </div>
              )}

              {/* Self Rating Quality Buttons */}
              <div className="pt-4 border-t border-gray-800 space-y-2">
                <div className="text-xs text-gray-400 font-semibold uppercase text-center">
                  Оцените сложность воспроизведения для SM-2:
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleSubmitQuality(0)}
                    className="py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-800"
                  >
                    0 — Не вспомнил
                  </button>
                  <button
                    onClick={() => handleSubmitQuality(1)}
                    className="py-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 text-amber-300 text-xs font-bold border border-amber-800"
                  >
                    1 — Частично
                  </button>
                  <button
                    onClick={() => handleSubmitQuality(3)}
                    className="py-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 text-xs font-bold border border-indigo-800"
                  >
                    3 — Правильно
                  </button>
                  <button
                    onClick={() => handleSubmitQuality(4)}
                    className="py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-800"
                  >
                    4 — Идеально
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 rounded-3xl text-center space-y-4">
              <div className="text-4xl">🎉</div>
              <h3 className="text-xl font-bold text-gray-100">На сегодня все карточки пройдены!</h3>
              <p className="text-sm text-gray-400">Отличная работа. Возвращайтесь завтра для нового цикла.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
