// Version: a6
// 统一使用 ip-api.com 接口以获取极其详尽的地理位置和运营商信息
const apiUrl = "http://ip-api.com/json/?lang=zh-CN";

// 基础网络请求封装（使用 Promise 配合 async/await）
async function request(params) {
  return new Promise((resolve) => {
    $httpClient.get(params, (error, response, data) => {
      resolve({ error, response, data });
    });
  });
}

// 通用的 IP 信息获取与解析函数
async function fetchIpInfo(prefix, policy) {
  const url = `${apiUrl}&t=${Date.now()}`;
  
  // 组装 Stash 规范的请求参数
  const params = { 
    url: url, 
    timeout: 6000, // 稍微放宽超时时间，确保大厂节点回传稳定
    headers: {} 
  };
  
  // 核心分流修复：遵循 Stash 官方规范，通过 Header 强制指定策略或直连
  if (policy) {
    params.headers['X-Stash-Selected-Proxy'] = encodeURIComponent(policy);
  }

  const { error, response, data } = await request(params);

  if (error) return { text: `${prefix}: 超时/失败`, hasError: true };

  try {
    const obj = JSON.parse(data);
    if (obj.status === "success") {
      const ip = obj.query;
      const country = obj.countryCode;
      const city = obj.city || "未知城市";
      const isp = obj.isp || "未知运营商";
      
      // ✨ 这里就是精确到城市和运营商的格式化输出整行文本
      return { text: `${prefix}: ${ip} \n  ${country} · ${city} · ${isp}`, hasError: false };
    }
    return { text: `${prefix}: 查询异常`, hasError: true };
  } catch (e) {
    return { text: `${prefix}: 解析异常`, hasError: true };
  }
}

// 主函数
async function main() {
  // ⚠️ 记得将这里修改为你 Stash 中实际存在的特定节点或策略组名称
  const targetNodeName = "AI平台"; 

  // 三路并发请求，互不干扰，速度极快
  const [local, proxy, specific] = await Promise.all([
    fetchIpInfo("境内落地", "DIRECT"),      // 强制直连
    fetchIpInfo("地域定位", "地域定位"),          // null,走默认规则分流
    fetchIpInfo("AI平台", targetNodeName)  // 强制走指定节点
  ]);

  // 只要有一路失败，面板就会变成橙色背景作为警告
  const hasError = local.hasError || proxy.hasError || specific.hasError;

  $done({
    title: "IP 检测",
    content: `${local.text}\n${proxy.text}\n${specific.text}`, // 通过 \n 换行输出
    backgroundColor: hasError ? "#FF9500" : "#34C759",        // 正常为绿色，异常为橙色
  });
}

// 脚本自执行入口
(async () => {
  try {
    await main();
  } catch (error) {
    $done({
      title: "系统故障",
      content: "脚本执行遭遇未知错误",
      backgroundColor: "#FF3B30",
      icon: "exclamationmark.triangle.fill"
    });
  }
})();