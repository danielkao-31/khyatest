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
