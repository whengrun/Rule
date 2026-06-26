// 统一使用 ip-api.com 接口以获取地理位置信息
const apiUrl = "http://ip-api.com/json/?lang=zh-CN";

// 基础网络请求封装
async function request(params) {
  return new Promise((resolve) => {
    $httpClient.get(params, (error, response, data) => {
      resolve({ error, response, data });
    });
  });
}

// 通用的 IP 信息获取与解析函数
async function fetchIpInfo(prefix, policy) {
  // 添加时间戳防缓存
  const url = `${apiUrl}&t=${Date.now()}`;
  
  // 组装请求参数，如果有 policy 则强制走该策略
  const params = { url: url, timeout: 5000 };
  if (policy) {
    params.policy = policy;
  }

  const { error, response, data } = await request(params);

  if (error) return { text: `${prefix}: 超时/失败`, hasError: true };

  try {
    const obj = JSON.parse(data);
    if (obj.status === "success") {
      // 成功提取 IP 和 国家代码
      return { text: `${prefix}: ${obj.query} (${obj.countryCode})`, hasError: false };
    }
    return { text: `${prefix}: 查询异常`, hasError: true };
  } catch (e) {
    return { text: `${prefix}: 数据解析异常`, hasError: true };
  }
}

// 主函数
async function main() {
  // ⚠️ 填入你想查询的特定节点或策略组名称（必须与节点列表完全一致）
  const targetNodeName = "AI平台"; 

  // 并发执行三个查询
  const [local, proxy, specific] = await Promise.all([
    fetchIpInfo("直连", "DIRECT"),
    fetchIpInfo("代理", null), // null 代表走 Stash 当前的默认代理分流
    fetchIpInfo("AI", targetNodeName)
  ]);

  // 如果有任何一个查询报错，面板底色变橙色警告
  const hasError = local.hasError || proxy.hasError || specific.hasError;

  $done({
    title: "IP 检测",
    content: `${local.text}\n${proxy.text}\n${specific.text}`,
    backgroundColor: hasError ? "#FF9500" : "#34C759", 
  });
}

// 启动脚本
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