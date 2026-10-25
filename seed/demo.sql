-- 可选：本地演示数据
-- 仅建议在本地开发数据库执行，不要把它当成正式馆藏。
-- 用法：pnpm db:seed:local
-- 说明：会写入 10 部示例作品，但不会删除你已有的游戏。
-- 游戏网址为 example.com 占位地址，部署前请替换或删除这些示例。

INSERT OR REPLACE INTO games (
  id, title, original_title, url, cover, banner, description, developer,
  release_date, tags, screenshots, source, source_id, rating, featured,
  sort_order, created_at, updated_at
) VALUES (
  'demo-atri', '亚托莉 -我挚爱的时光-', 'ATRI -My Dear Moments-', 'https://example.com/play/atri', 'https://lain.bgm.tv/pic/cover/l/46/f8/297264_Llz6w.jpg', 'https://t.vndb.org/sf/03/137403.jpg', '原因不明の海面上昇によって、 地表の多くが海に沈んだ近未来。

幼い頃の事故によって片足を失った少年・斑鳩夏生（いかるがなつき）は、
都市での暮らしに見切りを付け、 海辺の田舎町へと移り住んだ。

身よりのない彼に遺されたのは、
海洋地質学者だった祖母の船と潜水艇、 そして借金。

夏生は“失った未来”を取り戻すため、 謎の借金取り・キャサリンと共に、
祖母の遺産が眠るという海底の倉庫を目指して潜る。

そこで見つけたのは、
棺のような装置の中で眠る不思議な少女――アトリ。

彼女は、 人間と見紛うほどに精巧で感情豊かなロボットだった。
海底からサルベージされたアトリは言う。

「マスターが残した最後の命令を果たしたいんです。
それまで、 わたしが夏生さんの足になります！」

海に沈みゆく穏やかな町で、
少年とロボットの少女の、 忘れられない夏が始まる――。



[中文简介]
在不远的未来，海平面原因不明地急速上升，导致了地表多数都沉入海中。

小时候因为事故而失去一条腿的少年・斑鸠夏生，厌倦了都市的生活，移居到了海边的乡村小镇。曾经身为海洋地质学家的祖母留给他的、就只有船、潜水艇还有债务。

夏生为了取回“失去的未来”，与迷之讨债人凯瑟琳一起，潜海前往据说保存着祖母遗产的海底仓库。

在那里，他遇到了一位沉睡在如同棺材一般装置中不可思议的少女“亚托莉”。她是一位构造精密到与人类别无二致，而又丰富感情的机器人。

从海底被打捞起来的亚托莉如是说到。

“我想完成主人留给我的最后的命令。在此之前，我会成为夏生先生的腿！”

在一个逐渐沉入海中的平和小镇，少年和机器人少女的难忘夏日就这么开始了。', 'Front Wing × 枕',
  '2020-06-19', '["科幻","恋爱","催泪","全年龄","近未来"]', '["https://t.vndb.org/sf/03/137403.jpg","https://t.vndb.org/sf/04/137404.jpg","https://t.vndb.org/sf/05/137405.jpg","https://t.vndb.org/sf/10/137410.jpg","https://t.vndb.org/sf/11/137411.jpg","https://t.vndb.org/sf/60/137560.jpg","https://t.vndb.org/sf/63/137563.jpg","https://t.vndb.org/sf/64/137564.jpg"]', 'bangumi', '297264', '7.1', 1,
  0, '2026-10-24T04:56:50.700Z', '2026-10-24T04:56:50.700Z'
);
INSERT OR REPLACE INTO games (
  id, title, original_title, url, cover, banner, description, developer,
  release_date, tags, screenshots, source, source_id, rating, featured,
  sort_order, created_at, updated_at
) VALUES (
  'demo-steins-gate', '命运石之门', 'STEINS;GATE', 'https://example.com/play/steins-gate', 'https://lain.bgm.tv/pic/cover/l/fd/bd/3154_j71Z7.jpg', 'https://t.vndb.org/sf/23/8523.jpg', '亵渎神灵的第12项理论
————那是我们所得到的偶然产物

冈部伦太郎——通称冈伦——是个尚未从厨二病毕业的大学生。
自称为「狂气的疯狂科学家·鳳凰院凶真」，与其他两名成员组成立了名为「未来道具研究所」的社团，每天和朋友们发明着稀奇古怪的东西。

这样的他在一次偶然间发明了能将电子短信传到过去的道具，
也就是说产生了“时间机器”——

SERN、John Titor、幻之古董PC“IBN5100”、时间机器、
蝴蝶效应、时间旅行的11种理论——在这诸多要素偶然重叠之时，秋叶原卷起了世界规模的大事件！
被委以“未来选择权”的冈伦他们下的决断是？', '5pb.、Nitro+',
  '2009-10-15', '["科幻","时间旅行","悬疑","恋爱","全年龄"]', '["https://t.vndb.org/sf/23/8523.jpg","https://t.vndb.org/sf/24/8524.jpg","https://t.vndb.org/sf/25/8525.jpg","https://t.vndb.org/sf/31/8531.jpg","https://t.vndb.org/sf/63/67863.jpg","https://t.vndb.org/sf/64/67864.jpg","https://t.vndb.org/sf/65/67865.jpg","https://t.vndb.org/sf/66/67866.jpg"]', 'bangumi', '3154', '8.9', 0,
  1, '2026-10-24T04:56:51.051Z', '2026-10-24T04:56:51.051Z'
);
INSERT OR REPLACE INTO games (
  id, title, original_title, url, cover, banner, description, developer,
  release_date, tags, screenshots, source, source_id, rating, featured,
  sort_order, created_at, updated_at
) VALUES (
  'demo-clannad', 'CLANNAD', NULL, 'https://example.com/play/clannad', 'https://lain.bgm.tv/pic/cover/l/c5/1c/13_tQxwM.jpg', 'https://t.vndb.org/sf/67/8367.jpg', '季節は春、楽しく等身大で過ごす学園での日常から物語は始まり、やがてストーリーはヒロインたちとの恋愛に発展していきます。
深遠な世界観を背景に語られるのはひとつの町に住む人々それぞれの思い、その先にある「生きる」ということ。
その一方で、人々の思いを包み込むように存在する町そのものを幻想的なイメージで描き出していきます。
-----------------------------------------------------------------------------------------------------------

《CLANNAD》为2004年key社所发行的文字冒险游戏（AVG），和key社以往游戏不同的是，这款是以全年龄版PC的形式发行。CLANNAD在凯尔特语中代表的是“家族”。正如其名，这款游戏的核心价值及在描写各类的家族温暖，是个感动人心的落泪游戏。', 'Key、VISUAL ARTS',
  '2004-04-28', '["家族","恋爱","催泪","校园","全年龄"]', '["https://t.vndb.org/sf/67/8367.jpg","https://t.vndb.org/sf/69/8369.jpg","https://t.vndb.org/sf/70/8370.jpg","https://t.vndb.org/sf/72/8372.jpg","https://t.vndb.org/sf/74/8374.jpg","https://t.vndb.org/sf/17/9617.jpg","https://t.vndb.org/sf/18/9618.jpg","https://t.vndb.org/sf/10/175810.jpg"]', 'bangumi', '13', '8.9', 0,
  2, '2026-10-24T04:56:51.373Z', '2026-10-24T04:56:51.373Z'
);
INSERT OR REPLACE INTO games (
  id, title, original_title, url, cover, banner, description, developer,
  release_date, tags, screenshots, source, source_id, rating, featured,
  sort_order, created_at, updated_at
) VALUES (
  'demo-summer-pockets', '夏日口袋', 'Summer Pockets', 'https://example.com/play/summer-pockets', 'https://lain.bgm.tv/pic/cover/l/b2/72/200763_s2kSG.jpg', 'https://t.vndb.org/sf/74/111674.jpg', '亡くなった祖母の遺品整理のために夏休みを利用して、
鳥白島にやって来た主人公の鷹原 羽依里(たかはら はいり)。
祖母の思い出の品の片付けを手伝いながら、
初めて触れる「島の生活」に戸惑いつつも、順応していく。

海を見つめる少女と出会った。
不思議な蝶を探す少女と出会った。
思い出と海賊船を探す少女と出会った。
静かな灯台で暮らす少女と出会った。

島で新しい仲間が出来た――
この夏休みが終わらなければいいのにと、そう思った。', 'VISUAL ARTS / Key',
  '2018-06-29', '["夏日","恋爱","催泪","校园","全年龄"]', '["https://t.vndb.org/sf/74/111674.jpg","https://t.vndb.org/sf/76/111676.jpg","https://t.vndb.org/sf/77/111677.jpg","https://t.vndb.org/sf/54/127754.jpg","https://t.vndb.org/sf/55/127755.jpg","https://t.vndb.org/sf/57/127757.jpg","https://t.vndb.org/sf/65/176665.jpg","https://t.vndb.org/sf/62/208962.jpg"]', 'bangumi', '200763', '8.2', 0,
  3, '2026-10-24T04:56:51.699Z', '2026-10-24T04:56:51.699Z'
);
INSERT OR REPLACE INTO games (
  id, title, original_title, url, cover, banner, description, developer,
  release_date, tags, screenshots, source, source_id, rating, featured,
  sort_order, created_at, updated_at
) VALUES (
  'demo-white-album-2', '白色相簿2', NULL, 'https://example.com/play/white-album-2', 'https://t.vndb.org/cv/62/88962.jpg', 'https://t.vndb.org/sf/75/26875.jpg', 'A song drifted in, carried by the cold wind’s embrace—

It matched the guitar I played in the music room steeped in twilight.
It echoed the piano someone played in the room next door.

And then, from the rooftop, a voice rang out.
High and clear, like the chiming of bells, weaving the three scattered melodies into one.

It all began in late autumn.
When someone fell in love.

We were all giving our everything.
We were all pressing forward, driven by feelings we couldn''t hold back.
We were all earnest, unwavering, and honest.
In that fleeting moment, our hearts were bound, and we created memories that could never be replaced.

But because of that, someone fell in love.
A love that came too late. 
A love that should never have been.

Then came winter—covering all sins beneath the endless snow.
Then came spring—laying judgment bare as the snow melted away.

[Translated from DMM]', 'Leaf / AQUAPLUS / STING CO., LTD.',
  '2010-03-26', '["恋爱","三角恋","音乐","剧情","全年龄"]', '["https://t.vndb.org/sf/75/26875.jpg","https://t.vndb.org/sf/75/181475.jpg","https://t.vndb.org/sf/77/181477.jpg","https://t.vndb.org/sf/78/181478.jpg","https://t.vndb.org/sf/79/181479.jpg","https://t.vndb.org/sf/80/181480.jpg","https://t.vndb.org/sf/59/213659.jpg","https://t.vndb.org/sf/61/213661.jpg"]', 'vndb', 'v7771', '9', 0,
  4, '2026-10-24T04:56:51.944Z', '2026-10-24T04:56:51.944Z'
);
INSERT OR REPLACE INTO games (
  id, title, original_title, url, cover, banner, description, developer,
  release_date, tags, screenshots, source, source_id, rating, featured,
  sort_order, created_at, updated_at
) VALUES (
  'demo-sakura-no-uta', '樱之诗', 'サクラノ詩－櫻の森の上を舞う－', 'https://example.com/play/sakura-no-uta', 'https://t.vndb.org/cv/63/79663.jpg', 'https://t.vndb.org/sf/29/37029.jpg', 'ーWhat comes after happiness?

It is springtime, and Naoya Kusanagi has just been orphaned by the death of his father (the world-famous painter). He moves in with his best friend Kei’s family, where he grows closer to his homeroom teacher Ai and to Kei’s younger sister, the actress Shizuku Natsume.
As the new semester arrives, his childhood friend Rin Misakura, who had transferred to a different school long ago, returns to his life as well.

A gust stirs up a swirl of sakura petals—with a promised reunion in its wake.

Feelings grow fonder to time’s constant drumbeat, and the torrent of emotion begins to take shape—but where will it lead?

Sakura no Uta is a story of those whose paths stop short—and of those who walk on.

[From Shiravune]

A complete re-imagining of the stalled Sakura no Uta project by SCA-Ji, the writer of Subarashiki Hibi.', 'Makura',
  '2015-10-23', '["艺术","哲学","校园","恋爱","剧情"]', '["https://t.vndb.org/sf/29/37029.jpg","https://t.vndb.org/sf/27/38227.jpg","https://t.vndb.org/sf/86/86886.jpg","https://t.vndb.org/sf/87/86887.jpg","https://t.vndb.org/sf/90/86890.jpg","https://t.vndb.org/sf/28/87128.jpg","https://t.vndb.org/sf/30/87130.jpg","https://t.vndb.org/sf/26/237826.jpg"]', 'vndb', 'v562', '8.7', 0,
  5, '2026-10-24T04:56:52.185Z', '2026-10-24T04:56:52.185Z'
);
INSERT OR REPLACE INTO games (
  id, title, original_title, url, cover, banner, description, developer,
  release_date, tags, screenshots, source, source_id, rating, featured,
  sort_order, created_at, updated_at
) VALUES (
  'demo-planetarian', '星之梦', 'planetarian ～ちいさなほしのゆめ～', 'https://example.com/play/planetarian', 'https://lain.bgm.tv/pic/cover/l/2a/08/859_2s5MH.jpg', 'https://t.vndb.org/sf/12/40912.jpg', '故事是发生于未来世界，在世界大战的30年后，整个世界遭受了极严重的破坏，一位废墟猎人来到了一座因为战争而被废弃的都市来寻找可用物资，在都市里，他碰到了都市星象馆的招待机器人——星野梦美，故事就此开始……

作为Visual Art''s所提倡的“Kinetic Novel”的第一部，该系列与普通的视觉小说所不同的是，他没有给玩家自行游玩的部份，即剧情没有分岐等，只能按照一定的路线行走和观赏CG而已。于2004年11月29日发售了Yahoo! BB用户限定先行的Windows版，同年12月6日面向开始面向所有人发售下载版。之后在2006年4月28日发售了含有语音（只有女主角有）的盒装版，2006年8月24日又被PROTOTYPE（プロトタイプ）移植为PS2版（所有角色皆有语音）。', 'Key',
  '2004-12-06', '["科幻","末世","机器人","催泪","短篇"]', '["https://t.vndb.org/sf/12/40912.jpg","https://t.vndb.org/sf/13/40913.jpg","https://t.vndb.org/sf/14/40914.jpg","https://t.vndb.org/sf/49/41649.jpg","https://t.vndb.org/sf/71/170071.jpg","https://t.vndb.org/sf/72/170072.jpg","https://t.vndb.org/sf/73/170073.jpg","https://t.vndb.org/sf/74/170074.jpg"]', 'bangumi', '859', '7.9', 0,
  6, '2026-10-24T05:00:15.924Z', '2026-10-24T05:00:15.924Z'
);
INSERT OR REPLACE INTO games (
  id, title, original_title, url, cover, banner, description, developer,
  release_date, tags, screenshots, source, source_id, rating, featured,
  sort_order, created_at, updated_at
) VALUES (
  'demo-9-nine', '9-nine-', NULL, 'https://example.com/play/9-nine', 'https://lain.bgm.tv/pic/cover/l/16/6d/511321_n2NNy.jpg', 'https://t.vndb.org/sf/12/124412.jpg', '白巳津川市。

学園都市であること以外になんの特色もない街。

観光客を呼び込もうと町興しに励んでいるが、どれも不発。
しかし、思わぬ形で世間の注目を集めることになった。

ぶっきらぼうな態度をとりがちだが責任感が強く行動力のある頼れる青年。新海翔。
なんだかんだ言いながら周りのことを第一に考える優しい性格である。

普通の学生らしい平穏な生活を送っていたが、
白蛇九十九神社の神器が破損したことをきっかけに、
翔の日常に変化が訪れる。
その影には、異能に目覚めた少年少女たちの姿があった。

なんの特色も無い街に住む、
なんの変哲もない平凡な学生のはずだったが。

異能者たちが巻き起こす
数奇な運命に巻き込まれて……。', 'Palette',
  '2021-04-23', '["异能","悬疑","校园","恋爱","分割商法"]', '["https://t.vndb.org/sf/12/124412.jpg","https://t.vndb.org/sf/14/124414.jpg","https://t.vndb.org/sf/16/124416.jpg","https://t.vndb.org/sf/18/124418.jpg","https://t.vndb.org/sf/20/124420.jpg","https://t.vndb.org/sf/12/196012.jpg","https://t.vndb.org/sf/14/196014.jpg","https://t.vndb.org/sf/15/196015.jpg"]', 'bangumi', '511321', '6.9', 0,
  7, '2026-10-24T05:00:16.157Z', '2026-10-24T05:00:16.157Z'
);
INSERT OR REPLACE INTO games (
  id, title, original_title, url, cover, banner, description, developer,
  release_date, tags, screenshots, source, source_id, rating, featured,
  sort_order, created_at, updated_at
) VALUES (
  'demo-aokana', '苍之彼方的四重奏', '蒼の彼方のフォーリズム', 'https://example.com/play/aokana', 'https://t.vndb.org/cv/55/79855.jpg', 'https://t.vndb.org/sf/61/77461.jpg', 'In a world where flying through the sky is as simple as riding a bicycle, the sport "Flying Circus" is all the rage.

Following the discovery of anti-gravitons, special shoes that allow an individual to fly, Anti-Graviton Shoes, took the world by storm.

And with the Grav Shoes came an entirely new world for people to explore. Not long after, that revolution in technology gave birth to a brand new sport, Flying Circus, which used shoes to make players compete in the open sky. 

Hinata Masaya, who was once considered a prodigy, turned his back on Flying Circus after suffering a crushing defeat, although there was also another reason...

However, his former passion is reignited while teaching the new transfer student, Kurashina Asuka, how to fly.

This time, Masaya chooses to enter the world of Flying Circus not as a player, but as a coach. Sometimes fighting, and at other times encouraging each other, he and his team decided to challenge the top student-athletes in Japan.

Now, with Asuka by his side, how high will he be able to fly?

This is a love story about those who met through the sky, as well as the friends who surround them.

[Edited from NekoNyan]', 'sprite',
  '2014-11-28', '["运动","恋爱","校园","青春","全年龄"]', '["https://t.vndb.org/sf/61/77461.jpg","https://t.vndb.org/sf/62/77462.jpg","https://t.vndb.org/sf/67/77467.jpg","https://t.vndb.org/sf/69/77469.jpg","https://t.vndb.org/sf/18/149418.jpg","https://t.vndb.org/sf/19/149419.jpg","https://t.vndb.org/sf/20/149420.jpg","https://t.vndb.org/sf/21/149421.jpg"]', 'vndb', 'v12849', '8.3', 0,
  8, '2026-10-24T05:00:16.356Z', '2026-10-24T05:00:16.356Z'
);
INSERT OR REPLACE INTO games (
  id, title, original_title, url, cover, banner, description, developer,
  release_date, tags, screenshots, source, source_id, rating, featured,
  sort_order, created_at, updated_at
) VALUES (
  'demo-senren-banka', '千恋万花', '千恋＊万花', 'https://example.com/play/senren-banka', 'https://t.vndb.org/cv/46/80746.jpg', 'https://t.vndb.org/sf/37/96737.jpg', 'The village of Hoori lies deep in the middle of the mountains, inaccessible by rail. Since there isn’t much interaction with its surroundings, the town seems like it is stuck in the past. However, it is because of this exact olden feel and subsequent development that it has turned into a nice hot-springs town for tourists.

One of the popular sightseeing spots is the legendary katana Murasamemaru, embedded in stone. No one has been able to pull it out… until Masaomi somehow broke it in half. He has to take responsibility for his actions: “Marriage” with ‘shrine maiden princess’ Yoshino!? He was perplexed at the unexpected turn of events, but this is only just the beginning. What lies ahead for him is a much more peculiar and mysterious life, including his new fiancée, a mysterious girl who only he could touch, and the secret behind the curse that remains on the town.

What will become of Masaomi’s love amidst his rapidly changing life? The answer lies within the Murasamemaru in his hands.

[From Hau~ Omochikaeri!]', 'Yuzusoft',
  '2016-07-29', '["和风","恋爱","奇幻","校园","全年龄"]', '["https://t.vndb.org/sf/37/96737.jpg","https://t.vndb.org/sf/38/96738.jpg","https://t.vndb.org/sf/39/96739.jpg","https://t.vndb.org/sf/40/96740.jpg","https://t.vndb.org/sf/41/96741.jpg","https://t.vndb.org/sf/42/96742.jpg","https://t.vndb.org/sf/43/96743.jpg","https://t.vndb.org/sf/45/96745.jpg"]', 'vndb', 'v19073', '7.6', 0,
  9, '2026-10-24T05:00:16.552Z', '2026-10-24T05:00:16.552Z'
);
