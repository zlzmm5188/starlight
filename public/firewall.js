/**
 * Providence防火墙 - 反爬虫/反扫描
 * 自动跳转到真实站点
 */
(function() {
    'use strict';
    
    // 目标域名（防火墙域名）
    const FIREWALL_DOMAIN = 'xn--providence-ef6wr429a.com';
    
    // 真实站点地址
    const REAL_SITE = 'https://4kp3l0iq.top/splash.html';
    
    // 检测当前域名
    const currentDomain = window.location.hostname;
    
    // 如果是防火墙域名，立即跳转
    if (currentDomain === FIREWALL_DOMAIN) {
        console.log('[Firewall] Redirecting to real site...');
        window.location.replace(REAL_SITE);
    }
    
    // 防止被iframe嵌套
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }
    
    // 添加meta标签防止索引
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);
    
})();

