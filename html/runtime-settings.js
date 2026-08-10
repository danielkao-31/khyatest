'use strict';

/**
 * GitHub Pages 前端連接 GAS JSON API。
 * 前端不得放置試算表 ID、Drive 資料夾 ID 或管理密碼。
 */
window.APP_RUNTIME_CONFIG = Object.freeze({
  gasWebAppUrl: 'https://script.google.com/macros/s/AKfycbySdTUaZEq1MmhpU369sT8GEJqLZTNlHN0ZiEPBL0JjLvzDaAYHn9ymMUHQYzkDqKmD0g/exec',
  // 留空時管理後台沿用 gasWebAppUrl；有獨立管理部署時再填入其 /exec。
  adminGasWebAppUrl: '',
  releaseVersion: 'v0.13.22-perf1-visualfix1-groupui1-deployalign1',
  expectedApiContractVersion: '1.2.0',
  assetVersion: '20260806-deployalign1'
});

/*
 * my-page-cache1
 * 首頁 Dashboard 已有 Player / GroupJourney 時，在進入「我的」前
 * 填入既有 accountProfile / journey cache，避免重複 GAS read API。
 * 僅在有效 dashboard cache 下作用；既有 invalidation / scope 判斷維持不變。
 */
document.addEventListener('click', function(event) {
  const target = event && event.target && event.target.closest
    ? event.target.closest('#goMyBtn, #navMyBtn')
    : null;

  if (!target) {
    return;
  }

  if (
    typeof isCacheValid_ !== 'function' ||
    typeof getCache_ !== 'function' ||
    typeof setCache_ !== 'function' ||
    !isCacheValid_('dashboard')
  ) {
    return;
  }

  const dashboard = getCache_('dashboard');

  if (!dashboard || typeof dashboard !== 'object') {
    return;
  }

  if (!isCacheValid_('accountProfile') && dashboard.player) {
    setCache_('accountProfile', {
      player: dashboard.player
    });
  }

  if (
    !isCacheValid_('journey') &&
    dashboard.journey &&
    Object.prototype.hasOwnProperty.call(dashboard.journey, 'group')
  ) {
    setCache_('journey', dashboard.journey.group || null);
  }
}, true);

/*
 * task-group-gate1
 * Social panel 是衍生快取；只有它顯示成員不足 2 人時，
 * 才以既有 getMyVitalGroups 確認任務資格。後端資格驗證仍完整保留。
 */
(function installTaskGroupEligibilityConfirmation_() {
  let checking = false;

  document.addEventListener('click', function(event) {
    const target = event && event.target;
    const card = target && typeof target.closest === 'function'
      ? target.closest('[data-practice], [data-weekly-task]')
      : null;

    if (!card || !card.closest('#homeView') || typeof state === 'undefined') {
      return;
    }

    const dailyType = String(card.dataset.practice || '').trim();
    const weeklyType = String(card.dataset.weeklyTask || '').trim();
    const taskType = dailyType || weeklyType;
    const player = state.currentPlayer || {};
    const groupId = String(player.groupId || '').trim();
    const memberCount = Number(state.homeGroupMemberCount || 0);
    const enabled = state.homeGroupEnabled !== false;

    if (!taskType || !groupId || !enabled || memberCount >= 2) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (checking) {
      return;
    }
    checking = true;

    if (typeof setLoading === 'function') {
      setLoading(true, '確認活力組成員...');
    }

    callServer('getMyVitalGroups', player.playerId)
      .then(function(res) {
        if (!isSuccess(res)) {
          const message = typeof getResponseError === 'function'
            ? getResponseError(res, '無法確認活力組成員資料，請稍後再試。')
            : '無法確認活力組成員資料，請稍後再試。';
          if (typeof openInfoModal === 'function' && typeof escapeHtml === 'function') {
            openInfoModal('需要活力組', '<div class="empty-card">' + escapeHtml(message) + '</div>');
          }
          return;
        }

        const groups = res && res.data && Array.isArray(res.data.groups)
          ? res.data.groups
          : [];
        const group = groups.find(function(item) {
          return String(item && item.groupId || '').trim() === groupId;
        }) || null;

        state.vitalGroups = groups;
        if (typeof setCache_ === 'function') {
          setCache_('groupInfo', { groups: groups });
        }

        if (!group) {
          if (typeof openInfoModal === 'function') {
            openInfoModal(
              '需要活力組',
              '<div class="empty-card">找不到目前活力組資料，請更新首頁後再試。</div>'
            );
          }
          return;
        }

        const members = Array.isArray(group.members) ? group.members : [];
        const confirmedCount = Math.max(
          0,
          Number(group.memberCount || members.length || 0)
        );
        const confirmedEnabled = group.enabled !== false;

        state.homeGroupMemberCount = confirmedCount;
        state.homeGroupEnabled = confirmedEnabled;
        state.homeGroupStatusMessage = confirmedEnabled
          ? ''
          : '此活力組目前已停用，相關小組功能暫停使用。';

        const countTarget = document.querySelector('#homeMemberCountText');
        if (countTarget) {
          countTarget.textContent = String(confirmedCount);
        }

        if (!confirmedEnabled || confirmedCount < 2) {
          if (typeof ensureGroupFeatureReady === 'function') {
            ensureGroupFeatureReady();
          }
          return;
        }

        if (dailyType && typeof openPracticeModal === 'function') {
          openPracticeModal(dailyType);
        } else if (weeklyType && typeof openWeeklyTaskModal === 'function') {
          openWeeklyTaskModal(weeklyType);
        }
      })
      .catch(function(error) {
        const message = typeof getErrorMessage === 'function'
          ? getErrorMessage(error)
          : '無法確認活力組成員資料，請稍後再試。';
        if (typeof openInfoModal === 'function' && typeof escapeHtml === 'function') {
          openInfoModal('需要活力組', '<div class="empty-card">' + escapeHtml(message) + '</div>');
        }
      })
      .finally(function() {
        checking = false;
        if (typeof setLoading === 'function') {
          setLoading(false);
        }
      });
  }, true);
})();
