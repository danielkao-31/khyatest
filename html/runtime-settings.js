'use strict';

/**
 * GitHub Pages 前端連接 GAS JSON API。
 * 前端不得放置試算表 ID、Drive 資料夾 ID 或管理密碼。
 */
window.APP_RUNTIME_CONFIG = Object.freeze({
  gasWebAppUrl: 'https://script.google.com/macros/s/AKfycbySdTUaZEq1MmhpU369sT8GEJqLZTNlHN0ZiEPBL0JjLvzDaAYHn9ymMUHQYzkDqKmD0g/exec',
  // 留空時管理後台沿用 gasWebAppUrl；有獨立管理部署時再填入其 /exec。
  adminGasWebAppUrl: '',
  releaseVersion: 'v0.13.22-perf1',
  expectedApiContractVersion: '1.2.0',
  assetVersion: '20260813-stableasset1'
});
