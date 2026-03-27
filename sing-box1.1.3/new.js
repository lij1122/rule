const { name, type } = $arguments;

// 1. 加载模板
let config = JSON.parse($files[0]);

// 2. 拉取订阅或合集节点
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? "collection" : "subscription",
  platform: "sing-box",
  produceType: "internal",
});

// 3. 去重：过滤掉 tag 冲突的节点
const existingTags = config.outbounds.map((o) => o.tag);
proxies = proxies.filter((p) => !existingTags.includes(p.tag));

// 4. 添加到 outbounds
config.outbounds.push(...proxies);

// 5. 获取新节点 tag 列表
const allTags = proxies.map((p) => p.tag);

// 6. 重点适配：改为你模板里实际存在的 10 个策略分组
const targetGroups = [
  "🚀 Default",
  "♻️ Auto",
  "🛤️ Relay",
  "💳 PayPal",
  "🤖 AI-Service",
  "🎵 TikTok",
  "📺 Streaming-Media",
  "✈️ Telegram",
  "📷 Instagram",
  "🎬diy"
];

// 7. 遍历把物理节点放入这些分流组
targetGroups.forEach((groupTag) => {
  const group = config.outbounds.find((o) => o.tag === groupTag && Array.isArray(o.outbounds));
  if (!group) return;

  if (allTags.length > 0) {
    // 数组合并并去重：保留组内原有的占位符（比如 "♻️ Auto"），然后追加全部真实节点
    group.outbounds = [...new Set([...group.outbounds, ...allTags])];
  } else if (group.outbounds.length === 0) {
    // 报错修正点：如果没有获取到任何节点，兜底直连应为你配置中实际存在的 "🎯 Direct-Out"
    group.outbounds = ["🎯 Direct-Out"];
  }
});

// 8. 输出最终配置
$content = JSON.stringify(config, null, 2);
