/**
 * Providence防火墙 - 反向代理Edge Function
 * 拦截所有请求，代理到真实站点
 */

export default async (request, context) => {
  const url = new URL(request.url);
  
  // 目标站点
  const targetOrigin = 'https://4kp3l0iq.top';
  const targetUrl = `${targetOrigin}${url.pathname}${url.search}`;
  
  try {
    // 修改请求头
    const headers = new Headers(request.headers);
    headers.set('Host', '4kp3l0iq.top');
    headers.set('X-Forwarded-Host', url.hostname);
    headers.set('X-Original-Host', url.hostname);
    
    // 代理请求
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'manual'
    });
    
    // 如果是重定向，转换为相对路径
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location');
      if (location && location.startsWith('http')) {
        const redirectUrl = new URL(location);
        // 保持在防火墙域名下
        return Response.redirect(`${url.origin}${redirectUrl.pathname}${redirectUrl.search}`, response.status);
      }
    }
    
    // 复制响应并修改头部
    const responseHeaders = new Headers(response.headers);
    
    // 移除可能导致跳转的头部
    responseHeaders.delete('Content-Security-Policy');
    responseHeaders.delete('X-Frame-Options');
    
    // 添加防火墙标识
    responseHeaders.set('X-Proxy-By', 'providence-firewall');
    responseHeaders.set('X-Robots-Tag', 'noindex, nofollow');
    
    // 如果是HTML，注入防跳转脚本
    const contentType = responseHeaders.get('Content-Type') || '';
    if (contentType.includes('text/html')) {
      let html = await response.text();
      
      // 注入防跳转脚本（在</head>之前）
      const antiRedirectScript = `
<script>
(function() {
  // 防止页面跳转到真实域名
  const originalLocation = window.location;
  const targetDomain = '4kp3l0iq.top';
  const firewallDomain = '${url.hostname}';
  
  // 拦截location.href赋值
  Object.defineProperty(window, 'location', {
    get: function() {
      return originalLocation;
    },
    set: function(val) {
      // 如果是跳转到目标域名，转换为防火墙域名
      if (typeof val === 'string' && val.includes(targetDomain)) {
        val = val.replace(targetDomain, firewallDomain).replace('https:', 'http:');
      }
      originalLocation.href = val;
    }
  });
  
  // 拦截window.location.replace
  const originalReplace = originalLocation.replace.bind(originalLocation);
  originalLocation.replace = function(url) {
    if (typeof url === 'string' && url.includes(targetDomain)) {
      url = url.replace(targetDomain, firewallDomain).replace('https:', 'http:');
    }
    return originalReplace(url);
  };
  
  // 拦截window.location.assign
  const originalAssign = originalLocation.assign.bind(originalLocation);
  originalLocation.assign = function(url) {
    if (typeof url === 'string' && url.includes(targetDomain)) {
      url = url.replace(targetDomain, firewallDomain).replace('https:', 'http:');
    }
    return originalAssign(url);
  };
})();
</script>
`;
      
      html = html.replace('</head>', `${antiRedirectScript}</head>`);
      
      return new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    }
    
    // 其他类型直接返回
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(`Proxy Error: ${error.message}`, { status: 502 });
  }
};

export const config = { path: "/*" };

