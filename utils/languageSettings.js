export const DEFAULT_LANGUAGE_SETTINGS = {
    language: 'en'
};

export const SUPPORTED_LANGUAGE_OPTIONS = Object.freeze([
    Object.freeze({ key: 'en', label: 'English' }),
    Object.freeze({ key: 'vi', label: 'Tiếng Việt' })
]);

const LANGUAGE_SETTINGS_STORAGE_KEY = 'rune_pixel_survivors_language_settings_v1';

const TEMPLATE_TRANSLATIONS = Object.freeze({
    en: Object.freeze({
        hp_status: 'HP {hp} / {maxHp}{shieldText}',
        level_label: 'Lv {level}',
        xp_progress: '{xp} / {nextXp}',
        boss_label: 'BOSS',
        wave_label: 'WAVE {wave}',
        time_survived: 'TIME SURVIVED: {time}',
        enemies_killed: 'ENEMIES KILLED: {count}',
        level_reached: 'LEVEL REACHED: {level}',
        unlocked_character: 'UNLOCKED: {label}',
        clear_map: 'CLEAR {label}',
        max_upgrade: 'MAX {label}',
        unlock_dyn: 'UNLOCK {cost} DYN',
        language_value_en: 'ENGLISH',
        language_value_vi: 'TIẾNG VIỆT',
        current_value: 'Current {value}',
        next_value: 'Next {value}',
        max_value: 'Max {value}',
        dyn_value: '{value} DYN',
        maxed: 'MAXED',
        fully_upgraded: 'Fully upgraded',
        no_player_data: 'No player data',
        no_player_data_hint: 'Current player data is not available.',
        no_items_available: 'No items available.\nThe merchant cart is empty.',
        click_stat_hint: 'Click any stat line to see what it does.',
        item_info_title: '{name} Info',
        supporter_passive_title: '{name} Passive',
        no_detailed_description: 'No detailed description.',
        no_item_data: 'No item data.',
        no_passive_bonus: 'No passive bonus.',
        choose_supporter_subinfo: '',
        choose_card_subtitle: 'Pick 1 bonus before the shop opens',
        enable_effect: 'Enable {label}',
        explodes_on_hit: 'Explodes on hit',
        replaces_current_skill_effect: 'Replaces current skill effect',
        explodes_at_hit_location: 'Explodes at hit location',
        chance_to_apply_on_hit: '{chance}% chance to apply on hit',
        effect_chains_bonus: '{effect} chains +{value}',
        effect_chain_damage_bonus: '{effect} chain dmg +{value}%',
        effect_bonus: '{effect} bonus',
        support_hits_always_apply: 'Supporter hits always apply {effect}',
        support_hits_can_apply: 'Supporter hits can apply {effect}',
        heal_aura_base: 'Heal aura: +{value} HP base',
        armor_aura_base: 'Armor aura: +{value} armor base',
        buff_scales_effect_damage: 'Buff scales with effect damage',
        each_hit_reduces_buff_cd: 'Each hit reduces buff cooldown by 0.5s',
        in_supporter_range_attack_speed: 'While target is in supporter range: atk speed +{value}%',
        range_damage: 'Range {range}\nDamage {damage}',
        modifier_damageMultiplier: '{sign}{value}% dmg',
        modifier_critChance: '{sign}{value}% crit',
        modifier_critMultiplier: '{sign}{value}% crit dmg',
        modifier_attackSpeed: '{sign}{value}% atk spd',
        modifier_armor: '{sign}{value} armor',
        modifier_armorPierce: '{sign}{value}% armor pierce',
        modifier_skillRange: '{sign}{value} range',
        modifier_skillRangeFlat: '{sign}{value} range',
        modifier_hp: '{sign}{value} hp',
        modifier_healthRegenPerSecond: '{sign}{value}/s regen',
        modifier_lifesteal: '{sign}{value}% lifesteal',
        modifier_shield: '{sign}{value} shield',
        modifier_dodge: '{sign}{value}% dodge',
        modifier_moveSpeed: '{sign}{value} speed',
        modifier_areaSizeMultiplier: '{sign}{value}% area',
        modifier_projectileCount: '{sign}{value} projectile',
        modifier_knockbackMultiplier: '{sign}{value}% knockback',
        modifier_effectChance: '{sign}{value}% effect',
        modifier_effectDamageMultiplier: '{sign}{value}% effect dmg',
        modifier_effectDurationMultiplier: '{sign}{value}% effect dur',
        modifier_shockChainCount: '{sign}{value} shock chain',
        modifier_pickupRangeMultiplier: '{sign}{value}% pickup',
        modifier_goldGainMultiplier: '{sign}{value}% gold',
        stat_hp: 'HP {hp}/{maxHp}',
        stat_armor: 'Armor {value}',
        stat_armorPierce: 'Armor Pierce {value}%',
        stat_range: 'Range {value}',
        stat_speed: 'Speed {value}',
        stat_damage: 'Damage {value}%',
        stat_attackSpeed: 'Atk Spd {value}%',
        stat_critChance: 'Crit {value}%',
        stat_critDamage: 'Crit Dmg {value}%',
        stat_area: 'Area {value}%',
        stat_projectiles: 'Projectiles {value}',
        stat_knockback: 'Knockback {value}%',
        stat_effectChance: 'Effect {value}%',
        stat_effectDamage: 'Eff Dmg {value}%',
        stat_effectDuration: 'Eff Dur {value}%',
        stat_regen: 'Regen {value}/s',
        stat_lifesteal: 'Lifesteal {value}%',
        stat_shield: 'Shield {value}',
        stat_dodge: 'Dodge {value}%',
        stat_pickup: 'Pickup {value}',
        stat_gold: 'Gold {value}%',
        stat_xp: 'XP {value}%'
    }),
    vi: Object.freeze({
        hp_status: 'HP {hp} / {maxHp}{shieldText}',
        level_label: 'Lv {level}',
        xp_progress: '{xp} / {nextXp}',
        boss_label: 'BOSS',
        wave_label: 'WAVE {wave}',
        time_survived: 'THỜI GIAN SỐNG: {time}',
        enemies_killed: 'QUÁI ĐÃ HẠ: {count}',
        level_reached: 'CẤP ĐẠT ĐƯỢC: {level}',
        unlocked_character: 'MỞ KHÓA: {label}',
        clear_map: 'VƯỢT {label}',
        max_upgrade: 'NÂNG TỐI ĐA {label}',
        unlock_dyn: 'MỞ {cost} DYN',
        language_value_en: 'ENGLISH',
        language_value_vi: 'TIẾNG VIỆT',
        current_value: 'Hiện tại {value}',
        next_value: 'Tiếp theo {value}',
        max_value: 'Tối đa {value}',
        dyn_value: '{value} DYN',
        maxed: 'MAX',
        fully_upgraded: 'Đã nâng tối đa',
        no_player_data: 'Không có dữ liệu nhân vật',
        no_player_data_hint: 'Hiện không lấy được dữ liệu nhân vật hiện tại.',
        no_items_available: 'Không có vật phẩm nào.\nQuầy hàng hiện đang trống.',
        click_stat_hint: 'Chạm vào từng chỉ số để xem giải thích.',
        item_info_title: 'Thông tin {name}',
        supporter_passive_title: 'Nội tại {name}',
        no_detailed_description: 'Chưa có mô tả chi tiết.',
        no_item_data: 'Không có dữ liệu vật phẩm.',
        no_passive_bonus: 'Không có nội tại bổ sung.',
        choose_supporter_subinfo: '',
        choose_card_subtitle: 'Chọn 1 chỉ số trước khi vào shop',
        enable_effect: 'Mở hiệu ứng {label}',
        explodes_on_hit: 'Nổ khi trúng đích',
        replaces_current_skill_effect: 'Thay hiệu ứng kỹ năng hiện tại',
        explodes_at_hit_location: 'Phát nổ tại điểm va chạm',
        chance_to_apply_on_hit: '{chance}% tỉ lệ kích hoạt khi trúng',
        effect_chains_bonus: '{effect} +{value} lần lan',
        effect_chain_damage_bonus: '{effect} lan +{value}% sát thương',
        effect_bonus: 'Cường hóa {effect}',
        support_hits_always_apply: 'Đòn của trợ thủ luôn gây {effect}',
        support_hits_can_apply: 'Đòn của trợ thủ có thể gây {effect}',
        heal_aura_base: 'Hào quang hồi máu: +{value} HP gốc',
        armor_aura_base: 'Hào quang giáp: +{value} giáp gốc',
        buff_scales_effect_damage: 'Buff tăng theo sát thương hiệu ứng',
        each_hit_reduces_buff_cd: 'Mỗi đòn đánh giảm hồi chiêu buff 0.5s',
        in_supporter_range_attack_speed: 'Trong vùng trợ thủ: tốc đánh +{value}%',
        range_damage: 'Tầm {range}\nSát thương {damage}',
        modifier_damageMultiplier: '{sign}{value}% sát thương',
        modifier_critChance: '{sign}{value}% chí mạng',
        modifier_critMultiplier: '{sign}{value}% sát thương chí mạng',
        modifier_attackSpeed: '{sign}{value}% tốc đánh',
        modifier_armor: '{sign}{value} giáp',
        modifier_armorPierce: '{sign}{value}% xuyên giáp',
        modifier_skillRange: '{sign}{value} tầm',
        modifier_skillRangeFlat: '{sign}{value} tầm',
        modifier_hp: '{sign}{value} hp',
        modifier_healthRegenPerSecond: '{sign}{value}/s hồi máu',
        modifier_lifesteal: '{sign}{value}% hút máu',
        modifier_shield: '{sign}{value} khiên',
        modifier_dodge: '{sign}{value}% né tránh',
        modifier_moveSpeed: '{sign}{value} tốc chạy',
        modifier_areaSizeMultiplier: '{sign}{value}% phạm vi',
        modifier_projectileCount: '{sign}{value} đạn',
        modifier_knockbackMultiplier: '{sign}{value}% đẩy lùi',
        modifier_effectChance: '{sign}{value}% hiệu ứng',
        modifier_effectDamageMultiplier: '{sign}{value}% sát thương hiệu ứng',
        modifier_effectDurationMultiplier: '{sign}{value}% thời gian hiệu ứng',
        modifier_shockChainCount: '{sign}{value} lan điện',
        modifier_pickupRangeMultiplier: '{sign}{value}% hút vật phẩm',
        modifier_goldGainMultiplier: '{sign}{value}% vàng',
        stat_hp: 'HP {hp}/{maxHp}',
        stat_armor: 'Giáp {value}',
        stat_armorPierce: 'Xuyên giáp {value}%',
        stat_range: 'Tầm {value}',
        stat_speed: 'Tốc chạy {value}',
        stat_damage: 'Sát thương {value}%',
        stat_attackSpeed: 'Tốc đánh {value}%',
        stat_critChance: 'Chí mạng {value}%',
        stat_critDamage: 'ST chí mạng {value}%',
        stat_area: 'Phạm vi {value}%',
        stat_projectiles: 'Đạn {value}',
        stat_knockback: 'Đẩy lùi {value}%',
        stat_effectChance: 'Hiệu ứng {value}%',
        stat_effectDamage: 'ST hiệu ứng {value}%',
        stat_effectDuration: 'TG hiệu ứng {value}%',
        stat_regen: 'Hồi máu {value}/s',
        stat_lifesteal: 'Hút máu {value}%',
        stat_shield: 'Khiên {value}',
        stat_dodge: 'Né tránh {value}%',
        stat_pickup: 'Hút đồ {value}',
        stat_gold: 'Vàng {value}%',
        stat_xp: 'XP {value}%'
    })
});

const EXACT_TRANSLATIONS = Object.freeze({
    vi: Object.freeze({
        'LOADING': 'ĐANG TẢI',
        'Preparing assets...': 'Đang chuẩn bị tài nguyên...',
        'Ready': 'Sẵn sàng',
        'RUNE PIXEL SURVIVORS': 'RUNE PIXEL SURVIVORS',
        'RETRO FANTASY HUNT': 'SĂN QUÁI PIXEL CỔ ĐIỂN',
        'START GAME': 'BẮT ĐẦU',
        'START DEBUG MODE': 'VÀO DEBUG MODE',
        'UPGRADE': 'NÂNG CẤP',
        'CREDITS': 'CREDITS',
        'SETTINGS': 'CÀI ĐẶT',
        'CHARACTER SELECT': 'CHỌN TƯỚNG',
        'MAP SELECT': 'CHỌN MAP',
        'START HUNT': 'BẮT ĐẦU SĂN',
        'BACK': 'QUAY LẠI',
        'CONFIRM': 'XÁC NHẬN',
        'CHALLENGE LOCKED': 'KHÓA THEO ĐIỀU KIỆN',
        'UNLOCKED': 'ĐÃ MỞ',
        'MAX': 'MAX',
        'FULLY UPGRADED': 'ĐÃ NÂNG TỐI ĐA',
        'READY TO BUY': 'SẴN SÀNG MUA',
        'NOT ENOUGH DYNAMON': 'KHÔNG ĐỦ DYNAMON',
        'LOCK': 'KHÓA',
        'GOAL': 'MỤC TIÊU',
        'MUSIC': 'NHẠC',
        'SFX': 'ÂM THANH',
        'DMG TEXT': 'TEXT SÁT THƯƠNG',
        'DMG CAP': 'GIỚI HẠN TEXT',
        'LANGUAGE': 'NGÔN NGỮ',
        'FULLSCREEN': 'TOÀN MÀN HÌNH',
        'EXIT FULL': 'THOÁT FULL',
        'EXIT FULLSCREEN': 'THOÁT TOÀN MÀN HÌNH',
        'PAUSED': 'TẠM DỪNG',
        'RESUME': 'TIẾP TỤC',
        'QUIT TO MENU': 'THOÁT VỀ MENU',
        'GAME OVER': 'THUA CUỘC',
        'YOU WIN': 'CHIẾN THẮNG',
        'RETRY': 'CHƠI LẠI',
        'BACK TO MENU': 'VỀ MENU',
        'CURRENT STATS': 'CHỈ SỐ HIỆN TẠI',
        'SHOW STATS': 'HIỆN CHỈ SỐ',
        'HIDE STATS': 'ẨN CHỈ SỐ',
        'STATS': 'CHỈ SỐ',
        'CLOSE': 'ĐÓNG',
        'CHOOSE AN ITEM': 'CHỌN VẬT PHẨM',
        'Purchased': 'Đã mua',
        'EMPTY': 'TRỐNG',
        'Continue': 'Tiếp tục',
        'CHOOSE A SUPPORTER': 'CHỌN TRỢ THỦ',
        'CHOOSE A CARD': 'CHỌN THẺ',
        'No detailed description.': 'Chưa có mô tả chi tiết.',
        'No item data.': 'Không có dữ liệu vật phẩm.',
        'No passive bonus.': 'Không có nội tại bổ sung.',
        'ON': 'BẬT',
        'OFF': 'TẮT',
        'full': 'đầy đủ',
        'reduced': 'giảm bớt',
        'off': 'tắt',
        'merge': 'gộp',
        'replace': 'thay cũ',
        'unlimited': 'không giới hạn',
        'Survival': 'Sinh tồn',
        'Economy': 'Kinh tế',
        'Combat': 'Chiến đấu',
        'Max HP': 'HP tối đa',
        'Armor': 'Giáp',
        'Regen': 'Hồi máu',
        'Pickup Range': 'Tầm hút đồ',
        'Gold Gain': 'Tăng vàng',
        'XP Gain': 'Tăng XP',
        'Shop Reroll Discount': 'Giảm giá reroll shop',
        'Pre-shop Reroll': 'Reroll thẻ trước shop',
        'Supporter Reroll': 'Reroll trợ thủ',
        'Damage': 'Sát thương',
        'Attack Speed': 'Tốc đánh',
        'Crit Chance': 'Tỉ lệ chí mạng',
        'Effect Chance': 'Tỉ lệ hiệu ứng',
        'Increase starting max HP for every run.': 'Tăng HP tối đa khởi đầu cho mọi run.',
        'Add flat armor at run start.': 'Thêm giáp cố định khi bắt đầu run.',
        'Grant passive health regen each second.': 'Hồi máu thụ động mỗi giây.',
        'Increase loot pickup radius.': 'Tăng bán kính hút vật phẩm.',
        'Increase gold earned during runs.': 'Tăng lượng vàng kiếm được trong run.',
        'Increase XP gained from pickups.': 'Tăng lượng XP nhận từ vật phẩm.',
        'Lower normal shop reroll cost. Cost floor is 6 gold.': 'Giảm giá reroll shop thường. Mức sàn là 6 vàng.',
        'Add more rerolls to the pre-shop card choice.': 'Thêm số lần reroll cho thẻ trước shop.',
        'Add more rerolls to the supporter choice.': 'Thêm số lần reroll cho chọn trợ thủ.',
        'Increase global damage multiplier.': 'Tăng hệ số sát thương toàn cục.',
        'Make all skills fire more often.': 'Giúp mọi kỹ năng tung ra thường xuyên hơn.',
        'Add flat crit chance to all skills.': 'Tăng tỉ lệ chí mạng cộng thẳng cho mọi kỹ năng.',
        'Increase status effect application chance.': 'Tăng tỉ lệ gây hiệu ứng trạng thái.',
        'Normal': 'Thường',
        'Epic': 'Hiếm',
        'Legendary': 'Huyền thoại',
        'Vitality': 'Sinh lực',
        'Effect Damage': 'Sát thương hiệu ứng',
        'Move Speed': 'Tốc chạy',
        'Lifesteal': 'Hút máu',
        'Dodge': 'Né tránh',
        'Passive': 'Nội tại',
        'Church Sanctuary': 'Thánh Đường',
        'Inside Church': 'Bên Trong Thánh Đường',
        'Rock Field': 'Bãi Đá',
        'Lumina': 'Lumina',
        'Knight': 'Knight',
        'Aqua': 'Aqua',
        'Radian': 'Radian',
        'Frost': 'Frost',
        'Witch': 'Witch',
        'Asian Dragon': 'Asian Dragon',
        'Bodoi': 'Bodoi',
        'Gambler': 'Gambler',
        'Raiji': 'Raiji',
        'Warden': 'Warden',
        'Werewolf': 'Werewolf',
        'Assasin': 'Assasin',
        'A light mage, the last beacon against the darkness.': 'Một pháp sư ánh sáng, ngọn đèn cuối cùng chống lại bóng tối.',
        'A heavily armored melee fighter who sweeps a broad blade arc across enemies in front.': 'Một chiến binh cận chiến bọc giáp nặng, quét lưỡi kiếm rộng qua kẻ địch phía trước.',
        'A water sage who controls the flow to cleanse and protect.': 'Một hiền giả nước điều khiển dòng chảy để thanh tẩy và bảo hộ.',
        'An eastern exorcist, sealing demons with talismans and barriers.': 'Một pháp sư trừ tà phương Đông, phong ấn quỷ bằng bùa chú và kết giới.',
        'An ice mage who freezes enemies and slows the horde.': 'Một pháp sư băng giá đóng băng kẻ địch và làm chậm bầy quái.',
        'An ancient sorceress using forbidden magic to bend the battlefield.': 'Một phù thủy cổ xưa dùng ma thuật cấm để bẻ cong chiến trường.',
        'A mystical dragon spirit channeling arcane force with elegant precision.': 'Một linh hồn rồng huyền bí điều khiển ma lực với độ chính xác cao.',
        'A swift ranged fighter who throws Mu Coi shots that chain from one enemy into the next.': 'Một xạ thủ nhanh nhẹn ném Mu Coi có thể nảy từ mục tiêu này sang mục tiêu khác.',
        'A rogue cardsharp who bets everything on impossible rolls.': 'Một tay chơi bài liều lĩnh đặt cược tất cả vào những lần tung không tưởng.',
        'A lightning mage calling down thunder upon the swarm.': 'Một pháp sư lôi điện gọi sét trừng phạt bầy quái.',
        'A prison keeper who binds and suppresses dark entities.': 'Một quản ngục giam giữ và áp chế các thực thể bóng tối.',
        'A feral melee hunter that tears through enemies with oversized claw strikes.': 'Một thợ săn cận chiến hoang dã xé nát kẻ địch bằng vuốt khổng lồ.',
        'A close-range killer who darts in with fast knife stabs and clean finishing cuts.': 'Một sát thủ tầm gần lao vào bằng những nhát đâm dao nhanh và dứt khoát.',
        '+40 skill range.': '+40 tầm kỹ năng.',
        '+20% dodge chance.': '+20% tỉ lệ né tránh.',
        'Tidal Flow: water skill hits grant Flow, up to 5 stacks.\nEach stack gives +4% area size and +3% projectile speed.\nAt 5 stacks, the next water cast triggers Splash Burst on hit: 50% splash damage, freezes nearby enemies for 0.7s, then resets Flow.': 'Tidal Flow: kỹ năng nước khi trúng sẽ cộng Flow, tối đa 5 cộng dồn.\nMỗi cộng dồn cho +4% phạm vi và +3% tốc độ đạn.\nKhi đủ 5 cộng dồn, lần tung kỹ năng nước tiếp theo sẽ kích hoạt Splash Burst: gây 50% sát thương lan, đóng băng kẻ địch gần đó 0.7s rồi reset Flow.',
        'Ghost Summon calls forth spirits that persistently hunt nearby enemies.': 'Ghost Summon triệu hồi linh hồn liên tục truy đuổi kẻ địch gần đó.',
        'Casts Frost Zone: a freezing field that damages enemies and briefly freezes targets after repeated hits.': 'Tung Frost Zone: vùng băng gây sát thương và đóng băng ngắn sau nhiều lần trúng.',
        'Casts Ritual Zone: periodically places a magic circle that slows and damages enemies standing inside.': 'Tung Ritual Zone: định kỳ tạo ma trận làm chậm và gây sát thương lên kẻ địch đứng trong đó.',
        'Dragonfire: Flame explodes on hit for 30% bonus damage in a small area and leaves behind a burn cloud that applies burn to enemies entering it.': 'Dragonfire: Flame nổ khi trúng gây thêm 30% sát thương diện nhỏ và để lại mây lửa gây bỏng cho kẻ địch đi vào.',
        'Mu Coi auto-aims, chains once to another enemy on hit, and triggers a small burst when it redirects.': 'Mu Coi tự ngắm, nảy một lần sang mục tiêu khác và phát nổ nhỏ khi đổi hướng.',
        'Loaded Deck: +8% crit chance. Card Toss fires a 3-card fan with the center card aiming true and the side cards spreading outward.': 'Loaded Deck: +8% chí mạng. Card Toss bắn quạt 3 lá, lá giữa bám mục tiêu còn hai lá bên tỏa ra.',
        'Static Surge: +1 shock chain and heightened lightning precision.': 'Static Surge: +1 lần lan điện và tăng độ chính xác của sét.',
        'Detention Mark: first hit marks a target. Hitting the marked target again triggers a small explosion, briefly roots it, and resets the mark.': 'Detention Mark: đòn đầu tiên đánh dấu mục tiêu. Đánh lại mục tiêu đã bị đánh dấu sẽ gây nổ nhỏ, trói chân ngắn và reset dấu.',
        'Below 50% HP: +15% attack speed, +10 move speed, +8% lifesteal.\nHits against bleeding targets heal 1.5% max HP.': 'Khi dưới 50% HP: +15% tốc đánh, +10 tốc chạy, +8% hút máu.\nĐánh vào mục tiêu đang chảy máu hồi 1.5% HP tối đa.',
        'Phantom Slash: critical stab hits trigger a ghostly ambush slash for 35% bonus damage. The phantom appears behind a nearby enemy, cuts through it, and can trigger about once every 0.7s.': 'Phantom Slash: đòn đâm chí mạng sẽ gọi ra một nhát chém ma gây thêm 35% sát thương. Bóng ma xuất hiện sau lưng mục tiêu gần đó, chém xuyên qua và có thể kích hoạt khoảng mỗi 0.7s.',
        'Black Cat': 'Mèo Đen',
        'Blood Wolf': 'Sói Máu',
        'Fairy': 'Tiên Nhỏ',
        'Blue Bird': 'Chim Xanh',
        'Eye Monster': 'Quái Mắt',
        'Dragon Ice': 'Rồng Băng',
        'Fire Spirite': 'Tinh Linh Lửa',
        'Shock Mouse': 'Chuột Điện',
        'Poison Ball': 'Cầu Độc',
        'Shield Drone': 'Drone Khiên',
        'Rock': 'Đá',
        'Gold gain +20%\nCrit chance +5%': 'Tăng vàng +20%\nTỉ lệ chí mạng +5%',
        'Lifesteal +10%\nMelee characters gain +30% attack speed\nSupporter hits always apply Bleed': 'Hút máu +10%\nTướng cận chiến nhận +30% tốc đánh\nĐòn của trợ thủ luôn gây Chảy máu',
        'Heal aura: +35 HP every 15s, scales with effect damage\nEach hit reduces buff cooldown by 0.5s\nHealth regen +1/s\nMax HP +10%': 'Hào quang hồi máu: +35 HP mỗi 15s, tăng theo sát thương hiệu ứng\nMỗi đòn đánh giảm hồi chiêu buff 0.5s\nHồi máu +1/s\nHP tối đa +10%',
        'Projectile speed +20%\nArmor pierce +20%': 'Tốc độ đạn +20%\nXuyên giáp +20%',
        'Skill range +30\nCrit damage +10%\nSupporter hits always apply Mark': 'Tầm kỹ năng +30\nSát thương chí mạng +10%\nĐòn của trợ thủ luôn gây Đánh dấu',
        'Effect duration +30%\nSupporter hits always apply Freeze': 'Thời gian hiệu ứng +30%\nĐòn của trợ thủ luôn gây Đóng băng',
        'Effect damage +30%\nSupporter hits always apply Burn': 'Sát thương hiệu ứng +30%\nĐòn của trợ thủ luôn gây Bỏng',
        'Shock chain count +1\nAttack speed +10%\nSupporter hits always apply Shock': 'Số lần lan điện +1\nTốc đánh +10%\nĐòn của trợ thủ luôn gây Điện giật',
        'Effect duration +20%\nEffect damage +10%\nSupporter hits always apply Poison': 'Thời gian hiệu ứng +20%\nSát thương hiệu ứng +10%\nĐòn của trợ thủ luôn gây Độc',
        'Armor aura: +8 armor, scales with effect damage\nEach hit reduces buff cooldown by 0.5s\nArmor +1\nGain 20 shield every 10s': 'Hào quang giáp: +8 giáp, tăng theo sát thương hiệu ứng\nMỗi đòn đánh giảm hồi chiêu buff 0.5s\nGiáp +1\nNhận 20 khiên mỗi 10s',
        'Knockback +30%\nArmor +5\nSupporter hits trigger Explosion': 'Đẩy lùi +30%\nGiáp +5\nĐòn của trợ thủ kích hoạt Nổ',
        'Iron Sword': 'Kiếm Sắt',
        'Sharpened Blade': 'Lưỡi Kiếm Sắc',
        'Heavy Edge': 'Đại Kiếm Nặng',
        'Quick Gloves': 'Găng Nhanh',
        'Battle Focus': 'Tập Trung Chiến Đấu',
        'Steel Armor': 'Giáp Thép',
        'Iron Armo': 'Giáp Sắt',
        'Ice Armo': 'Giáp Băng',
        'Vital Ring': 'Nhẫn Sinh Lực',
        'Regeneration Charm': 'Bùa Hồi Phục',
        'Blood Pendant': 'Mặt Dây Máu',
        'Guardian Core': 'Lõi Hộ Vệ',
        'Swift Boots': 'Ủng Nhanh',
        'Wide Grip': 'Tay Cầm Rộng',
        'Extended Core': 'Lõi Mở Rộng',
        'Extra Barrel': 'Nòng Phụ',
        'Cooldown Module': 'Mô-đun Hồi Chiêu',
        'Combat Injector': 'Ống Tiêm Chiến Đấu',
        'Force Core': 'Lõi Lực',
        'Glass Cannon': 'Pháo Kính',
        'Berserker Blood': 'Máu Cuồng Chiến',
        'Sniper Scope': 'Ống Ngắm Bắn Tỉa',
        'Heavy Payload': 'Tải Trọng Nặng',
        'Overcharged Reactor': 'Lò Phản Ứng Quá Tải',
        'Unstable Shield': 'Khiên Bất Ổn',
        'Speed Injector': 'Ống Tiêm Tốc Độ',
        'Overgrowth Engine': 'Động Cơ Phì Đại',
        'Time Distorter': 'Bẻ Cong Thời Gian',
        'Abyssal Catalyst': 'Xúc Tác Vực Sâu',
        'Singularity Field': 'Trường Kỳ Dị',
        'Phantom Stride': 'Bước Ma Ảnh',
        'Rotheart Sigil': 'Ấn Tim Mục',
        'Fractured Tempo': 'Nhịp Gãy',
        'Vampire Pact': 'Khế Ước Ma Cà Rồng',
        'Reckless Core': 'Lõi Liều Lĩnh',
        'Impact Engine': 'Động Cơ Va Chạm',
        'Toxic Catalyst': 'Xúc Tác Độc',
        'Lingering Curse': 'Lời Nguyền Lưu Dấu',
        'Chain Amplifier': 'Khuếch Đại Chuỗi',
        'Flame': 'Lửa',
        'Venom Trail': 'Dấu Độc',
        'Fire Coat': 'Áo Lửa',
        'Elemental Overload': 'Quá Tải Nguyên Tố',
        'Shockwave Core': 'Lõi Sóng Điện',
        'Fire Core': 'Lõi Lửa',
        'Ice Core': 'Lõi Băng',
        'Poison Core': 'Lõi Độc',
        'Shock Core': 'Lõi Điện',
        'Aim Core': 'Lõi Ngắm',
        'Afang': 'Afang',
        'Explore Core': 'Lõi Nổ',
        'Magnet Core': 'Lõi Nam Châm',
        'Golden Idol': 'Thần Tượng Vàng',
        'Greed Engine': 'Động Cơ Tham Lam',
        '+2 armor, but heavy plating reduces move speed by 5.': '+2 giáp, nhưng lớp giáp nặng làm giảm 5 tốc chạy.',
        '+3 armor, but the frozen shell reduces attack speed by 15%.': '+3 giáp, nhưng lớp băng làm giảm 15% tốc đánh.',
        '+1 projectile, but lowers damage per shot.': '+1 đạn, nhưng giảm sát thương mỗi viên.',
        '-20 HP, +10% effect damage, leaves a poison trail behind the player.': '-20 HP, +10% sát thương hiệu ứng, để lại vệt độc phía sau người chơi.',
        '+20 HP, -2 armor. Every 1s releases a fire wave in radius 70, dealing damage equal to 15% of the owner max HP and applying burn.': '+20 HP, -2 giáp. Mỗi 1s phát sóng lửa bán kính 70, gây sát thương bằng 15% HP tối đa của chủ sở hữu và gây Bỏng.',
        'inside_church': 'Inside Church',
        'maprock_field': 'Rock',
        'church_sanctuary': 'Church Sanctuary',
        'ranged': 'TẦM XA',
        'melee': 'CẬN CHIẾN',
        'English': 'English',
        'Tiếng Việt': 'Tiếng Việt',
        'LEVEL UP': 'LÊN CẤP',
        'MISS': 'TRƯỢT'
    })
});

function interpolate(template, params = {}) {
    return String(template ?? '').replace(/\{(\w+)\}/g, (_match, key) => `${params?.[key] ?? ''}`);
}

function sanitizeLanguageSettings(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const language = String(source.language ?? DEFAULT_LANGUAGE_SETTINGS.language);
    const supported = SUPPORTED_LANGUAGE_OPTIONS.some((option) => option.key === language);
    return {
        language: supported ? language : DEFAULT_LANGUAGE_SETTINGS.language
    };
}

function loadStoredLanguageSettings() {
    try {
        const raw = globalThis?.localStorage?.getItem?.(LANGUAGE_SETTINGS_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_LANGUAGE_SETTINGS };
        return sanitizeLanguageSettings(JSON.parse(raw));
    } catch (_error) {
        return { ...DEFAULT_LANGUAGE_SETTINGS };
    }
}

function saveStoredLanguageSettings(settings) {
    try {
        globalThis?.localStorage?.setItem?.(
            LANGUAGE_SETTINGS_STORAGE_KEY,
            JSON.stringify(sanitizeLanguageSettings(settings))
        );
    } catch (_error) {
        // Ignore storage failures.
    }
}

function resolveRegistry(target) {
    return target?.registry ?? target ?? null;
}

export function ensureLanguageSettings(target) {
    const registry = resolveRegistry(target);
    if (!registry?.get) return loadStoredLanguageSettings();
    const current = registry.get('languageSettings');
    const stored = loadStoredLanguageSettings();
    const next = sanitizeLanguageSettings({ ...DEFAULT_LANGUAGE_SETTINGS, ...stored, ...(current ?? {}) });
    if (current?.language !== next.language) {
        registry.set('languageSettings', next);
    }
    saveStoredLanguageSettings(next);
    return next;
}

export function getLanguageSettings(target) {
    return ensureLanguageSettings(target);
}

export function getCurrentLanguage(target) {
    return getLanguageSettings(target).language ?? DEFAULT_LANGUAGE_SETTINGS.language;
}

export function updateLanguageSetting(target, language) {
    const registry = resolveRegistry(target);
    const next = sanitizeLanguageSettings({ ...getLanguageSettings(target), language });
    registry?.set?.('languageSettings', next);
    saveStoredLanguageSettings(next);
    return next;
}

export function getLanguageLabel(target, language) {
    const resolved = String(language ?? getCurrentLanguage(target));
    if (resolved === 'vi') return t(target, 'language_value_vi');
    return t(target, 'language_value_en');
}

export function t(target, key, params = {}, fallback = '') {
    const language = getCurrentLanguage(target);
    const template = TEMPLATE_TRANSLATIONS[language]?.[key]
        ?? TEMPLATE_TRANSLATIONS.en?.[key]
        ?? fallback
        ?? key;
    return interpolate(template, params);
}

export function translateText(target, text) {
    if (text === null || text === undefined) return text;
    const language = getCurrentLanguage(target);
    if (language === 'en') return text;
    const lookup = EXACT_TRANSLATIONS[language] ?? {};
    return lookup[text] ?? text;
}
