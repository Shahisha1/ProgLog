// Local trophy/achievement records bundled with Proglog.
// Only records that are actually present in the project are included;
// totals come separately from the verified platform metadata.
var TROPHY_DATABASE = {
  "tlou-part-1": [
    {
      "id": "tlou-01",
      "name": "It can't be for nothing",
      "tier": "platinum",
      "tag": "Story",
      "description": "Collect all trophies.",
      "guide": "Automatically unlocks once all 28 other trophies in Part I and the Left Behind DLC have been earned. No multiplayer or difficulty barriers."
    },
    {
      "id": "tlou-02",
      "name": "No Matter What",
      "tier": "gold",
      "tag": "Story",
      "description": "Complete Part I.",
      "guide": "Awarded after completing the final chapter (The Hospital and Epilogue in Jackson) on any difficulty level."
    },
    {
      "id": "tlou-03",
      "name": "Don't Go",
      "tier": "gold",
      "tag": "DLC",
      "description": "Complete Left Behind.",
      "guide": "Finish all 6 chapters of the Left Behind story DLC. Accessible from the main menu."
    },
    {
      "id": "tlou-04",
      "name": "Look for the Light",
      "tier": "gold",
      "tag": "Collectible",
      "description": "Find all 30 Firefly pendants.",
      "guide": "Search high and low—many pendants hang in trees or streetlights (shoot them down) across Boston, Pittsburgh, Tommy’s Dam, University, and Hospital."
    },
    {
      "id": "tlou-05",
      "name": "Endure and Survive",
      "tier": "gold",
      "tag": "Collectible",
      "description": "Collect all 13 comics.",
      "guide": "Comics begin appearing in Pittsburgh. Keep an eye out inside air vents, abandoned bedrooms, and roadside campers."
    },
    {
      "id": "tlou-06",
      "name": "Chronicles",
      "tier": "gold",
      "tag": "Collectible",
      "description": "Find all 97 notes and artifacts.",
      "guide": "Includes 88 artifacts in the main story and 9 in Left Behind. Always check drawer units, office desks, and corpses. Inspect items front and back."
    },
    {
      "id": "tlou-07",
      "name": "Getting to Know You",
      "tier": "gold",
      "tag": "Collectible",
      "description": "Engage in all 54 optional conversations.",
      "guide": "Wait near companion characters (Ellie, Tess, Bill, Henry) until the conversation prompt appears. Some require examining environmental props first."
    },
    {
      "id": "tlou-08",
      "name": "That's All I Got",
      "tier": "gold",
      "tag": "Collectible",
      "description": "Survive all of Ellie's jokes.",
      "guide": "Trigger all joke book moments: 4 in Pittsburgh (after clearing bookstore/hotel areas), 1 in the Suburbs (by the joke graffiti), and 1 in Left Behind."
    },
    {
      "id": "tlou-09",
      "name": "Something to Fight For",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Find all 12 training manuals.",
      "guide": "Training manuals upgrade your crafted shivs, health packs, and smoke bombs. The first is in Bill’s safehouse; others are in hotel safes and sewer stashes."
    },
    {
      "id": "tlou-10",
      "name": "Combat Ready",
      "tier": "silver",
      "tag": "Combat",
      "description": "Fully upgrade a weapon.",
      "guide": "Max out all upgrade nodes on any single weapon at a workbench. The Revolver or Hunting Rifle requires fewer parts than long guns."
    },
    {
      "id": "tlou-11",
      "name": "Master of Unlocking",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Break into every locked door using shivs (13 doors).",
      "guide": "Always keep at least 1 crafted shiv in reserve. Unlocking doors yields substantial ammo, parts, supplements, and collectibles."
    },
    {
      "id": "tlou-12",
      "name": "Prepared for the Worst",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Find all 11 workbenches.",
      "guide": "Interact with all 11 workbenches scattered across chapters from Boston Outskirts through the Bus Depot."
    },
    {
      "id": "tlou-13",
      "name": "Sticky Fingers",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Open all 4 safes.",
      "guide": "Find the combination note nearby and unlock the safes in Boston QZ (03-43-78), Bill’s Town (05-17-101), Pittsburgh Hotel (22-10-56), and Suburbs (08-21-36)."
    },
    {
      "id": "tlou-14",
      "name": "Sharpest Tool in the Shed",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Find all 5 workbench tool kits.",
      "guide": "Tool kits unlock higher tier weapon upgrades: Tool 1 in Bill’s armory, Tool 2 in Pittsburgh garage, Tool 3 in Sewers, Tool 4 in University, Tool 5 in Bus Depot tent."
    },
    {
      "id": "tlou-15",
      "name": "Build 'Em Up, Break 'Em Down",
      "tier": "silver",
      "tag": "Combat",
      "description": "Upgrade and then break one of every melee weapon.",
      "guide": "Craft a blade upgrade onto each weapon type and use it until it breaks: 2x4 Plank, Baseball Bat, Lead Pipe, Machete, and Hatchet."
    },
    {
      "id": "tlou-16",
      "name": "Fallen Firefly",
      "tier": "bronze",
      "tag": "Collectible",
      "description": "Find a Firefly pendant.",
      "guide": "Earliest opportunity is in the Boston Quarantine Zone after leaving the checkpoint."
    },
    {
      "id": "tlou-17",
      "name": "Self Help",
      "tier": "bronze",
      "tag": "Collectible",
      "description": "Find one training manual.",
      "guide": "Found on the bar counter in Bill’s Town safehouse."
    },
    {
      "id": "tlou-18",
      "name": "Savage Starlight Fan",
      "tier": "bronze",
      "tag": "Collectible",
      "description": "Find a comic.",
      "guide": "First comic is located on the highway vehicle just before entering Pittsburgh."
    },
    {
      "id": "tlou-19",
      "name": "Geared Up",
      "tier": "bronze",
      "tag": "Combat",
      "description": "Craft every item.",
      "guide": "Craft one of each: Health Kit, Shiv, Molotov, Bomb, Smoke Bomb, and Melee Upgrade."
    },
    {
      "id": "tlou-20",
      "name": "In Memoriam",
      "tier": "bronze",
      "tag": "Story",
      "description": "Pick up Frank's note after it is discarded.",
      "guide": "In Bill's Town house, grab Frank's Note from the bedroom table, hand it to Bill, then pick it back up off the floor after he drops it."
    },
    {
      "id": "tlou-21",
      "name": "Lights Out",
      "tier": "bronze",
      "tag": "Combat",
      "description": "While in stealth, turn off the generator in the Pittsburgh financial district.",
      "guide": "Sneak past all hunters in the plaza and shut off the noisy spotlight generator on the first floor without triggering combat."
    },
    {
      "id": "tlou-22",
      "name": "Waterlogged",
      "tier": "bronze",
      "tag": "Story",
      "description": "Ride the floating contraption with Ellie, Henry, and Sam.",
      "guide": "In the Sewers, ferry Ellie across the water on a wooden pallet so she can activate the generator contraption."
    },
    {
      "id": "tlou-23",
      "name": "Left Hanging",
      "tier": "bronze",
      "tag": "Story",
      "description": "Leave Ellie hanging on a high five.",
      "guide": "In the Pittsburgh Hotel elevator shaft, after Ellie clears the way and offers a high-five, simply walk away without pressing Triangle."
    },
    {
      "id": "tlou-24",
      "name": "Who's a Good Boy?",
      "tier": "bronze",
      "tag": "Story",
      "description": "Pet Buckley the dog.",
      "guide": "At Tommy's Hydroelectric Dam in Jackson, interact with Buckley sitting near the entrance before walking into the generator room."
    },
    {
      "id": "tlou-25",
      "name": "Nobody's Perfect",
      "tier": "bronze",
      "tag": "DLC",
      "description": "Played the Jak X game in Left Behind.",
      "guide": "In Raja's Arcade (Left Behind - Chapter 4: Fun and Games), walk to the back corner and interact with the Jak X arcade cabinet."
    },
    {
      "id": "tlou-26",
      "name": "Brick Master",
      "tier": "bronze",
      "tag": "DLC",
      "description": "Win the brick throwing contest against Riley.",
      "guide": "In Left Behind Chapter 2 (Mallrats), break all 7 windows on the red car with thrown bricks before Riley smashes hers."
    },
    {
      "id": "tlou-27",
      "name": "Angel Knives",
      "tier": "bronze",
      "tag": "DLC",
      "description": "Defeat Black Fang without getting hit in Angel Knives.",
      "guide": "In Left Behind Chapter 4 (Fun and Games), play the arcade fighting game and nail all quick-time prompts without missing."
    },
    {
      "id": "tlou-28",
      "name": "Skillz",
      "tier": "bronze",
      "tag": "DLC",
      "description": "Win the water gun fight against Riley.",
      "guide": "In Left Behind Chapter 5, score 3 hits on Riley in the mall corridors before she hits you."
    },
    {
      "id": "tlou-29",
      "name": "Live Bait",
      "tier": "bronze",
      "tag": "DLC",
      "description": "Use bottles or bricks to lead infected to attack humans.",
      "guide": "In Left Behind Chapter 6, throw bottles to direct Stalkers/Clickers straight into hostile Hunter squads."
    }
  ],
  "ghost-of-tsushima": [
    {
      "id": "got-01",
      "name": "Living Legend",
      "tier": "platinum",
      "tag": "Story",
      "description": "Obtain all trophies.",
      "guide": "Unlocked once all 51 other trophies across Act I, II, III, and Tsushima exploration are completed."
    },
    {
      "id": "got-02",
      "name": "Mono No Aware",
      "tier": "gold",
      "tag": "Story",
      "description": "Leave the past behind and accept the mantle of your new persona.",
      "guide": "Complete the final duel in Jin’s emotional journey (Act III finale)."
    },
    {
      "id": "got-03",
      "name": "Master Liberator",
      "tier": "silver",
      "tag": "Combat",
      "description": "Liberate the entirety of Tsushima island.",
      "guide": "Clear all Mongol farmsteads, camps, and strongholds across Izuhara, Toyotama, and Kamiagata."
    },
    {
      "id": "got-04",
      "name": "Cooper Clan Cosplayer",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Dress up as a legendary thief.",
      "guide": "Equip Gosaku’s Armor dyed Ocean’s Guardian (from Kamiagata merchant), Crooked Kama Headband, and Sly Tanuki Sword Kit."
    },
    {
      "id": "got-05",
      "name": "Body, Mind, and Spirit",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Complete all Hot Springs, Haiku, Inari Shrines, and Bamboo Strikes.",
      "guide": "Follow golden birds and wind guides to locate every landmark across the 3 island prefectures."
    },
    {
      "id": "got-06",
      "name": "Have a Nice Fall",
      "tier": "bronze",
      "tag": "Combat",
      "description": "Kill an enemy with fall damage by kicking them off a ledge.",
      "guide": "Unlock Typhoon Kick (Wind Stance) or Shoulder Charge and punt a Mongol off an elevated cliff or watchtower."
    }
  ],
  "elden-ring": [
    {
      "id": "er-01",
      "name": "Elden Ring",
      "tier": "platinum",
      "tag": "Story",
      "description": "Obtain all achievements.",
      "guide": "Unlocked after collecting all 41 other achievements in the Lands Between."
    },
    {
      "id": "er-02",
      "name": "Elden Lord",
      "tier": "gold",
      "tag": "Story",
      "description": "Achieve the \"Elden Lord\" ending.",
      "guide": "Mend the Elden Ring at the fractured Marika after defeating the Elden Beast (standard or mended rune variations)."
    },
    {
      "id": "er-03",
      "name": "Age of the Stars",
      "tier": "gold",
      "tag": "Story",
      "description": "Achieve the \"Age of the Stars\" ending.",
      "guide": "Complete Ranni the Witch’s questline and summon her blue sign at the fractured Marika."
    },
    {
      "id": "er-04",
      "name": "Lord of Frenzied Flame",
      "tier": "gold",
      "tag": "Story",
      "description": "Achieve the \"Lord of Frenzied Flame\" ending.",
      "guide": "Inherit the Frenzied Flame from the Three Fingers beneath the Subterranean Shunning-Grounds."
    },
    {
      "id": "er-05",
      "name": "Shardbearer Malenia",
      "tier": "gold",
      "tag": "Combat",
      "description": "Defeat Shardbearer Malenia, Blade of Miquella.",
      "guide": "Navigate the Haligtree secret area accessed via the Haligtree Secret Medallion at the Grand Lift of Rold."
    },
    {
      "id": "er-06",
      "name": "Legendary Armaments",
      "tier": "gold",
      "tag": "Collectible",
      "description": "Acquire all 9 legendary armaments.",
      "guide": "Collect: Bolt of Gransax (Missable before Ashen Capital!), Ruins Greatsword, Eclipse Shotel, Sword of Night and Flame, Marais Executioner Sword, Dark Moon Greatsword, Devourer’s Scepter, Golden Order Greatsword, and Grafted Blade Greatsword."
    },
    {
      "id": "er-07",
      "name": "Legendary Ashen Remains",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Acquire all 6 legendary spirit ashes.",
      "guide": "Includes Mimic Tear, Black Knife Tiche, Lhutel the Headless, Ancient Dragon Knight Kristoff, Redmane Knight Ogha, and Cleanrot Knight Finlay."
    },
    {
      "id": "er-08",
      "name": "Legendary Sorceries and Incantations",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Acquire all 7 legendary sorceries and incantations.",
      "guide": "Collect Flame of the Fell God, Greyoll’s Roar, Elden Stars, Ranni’s Dark Moon, Comet Azur, Stars of Ruin, and Founding Rain of Stars."
    },
    {
      "id": "er-09",
      "name": "Legendary Talismans",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Acquire all 8 legendary talismans.",
      "guide": "Find Radagon’s Soreseal, Marika’s Soreseal, Dragoncrest Greatshield Talisman, Moon of Nokstella, Old Lord’s Talisman, Radagon Icon, Godfrey Icon, and Erdtree’s Favor +2."
    },
    {
      "id": "er-10",
      "name": "Shardbearer Radahn",
      "tier": "silver",
      "tag": "Combat",
      "description": "Defeat Shardbearer Radahn in Caelid.",
      "guide": "Participate in the Radahn Festival at Redmane Castle and defeat Starscourge Radahn on the battlefield."
    }
  ],
  "cyberpunk-2077": [
    {
      "id": "cp-01",
      "name": "Never Fade Away",
      "tier": "platinum",
      "tag": "Story",
      "description": "Unlock all trophies.",
      "guide": "Awarded after completing all main jobs, district gigs, and ending paths."
    },
    {
      "id": "cp-02",
      "name": "The World",
      "tier": "gold",
      "tag": "Story",
      "description": "Complete the main storyline.",
      "guide": "Finish any ending sequence after the point of no return at Embers."
    },
    {
      "id": "cp-03",
      "name": "Breathtaking",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Collect all items that once belonged to Johnny Silverhand.",
      "guide": "Acquire Johnny’s aviators, tank top, samurai jacket, pants, shoes, and Malorian Arms 3516 pistol."
    },
    {
      "id": "cp-04",
      "name": "It’s Elementary",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Complete all gigs and NCPD scanner hustles in Watson.",
      "guide": "Clear all blue badges and green gig icons across Northside, Arasaka Waterfront, Little China, and Kabuki."
    },
    {
      "id": "cp-05",
      "name": "Autojock",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Buy all vehicles available for purchase.",
      "guide": "Purchase all fixer rides across Night City (requires substantial Eurodollars)."
    },
    {
      "id": "cp-06",
      "name": "V for Vendetta",
      "tier": "bronze",
      "tag": "Combat",
      "description": "After reviving with Second Heart, eliminate the enemy who killed you within 5 seconds.",
      "guide": "Equip Second Heart cyberware (Body 16 required) and take down your killer right after reviving."
    }
  ],
  "god-of-war-2018": [
    {
      "id": "gow-01",
      "name": "Father and Son",
      "tier": "platinum",
      "tag": "Story",
      "description": "Obtain all other trophies.",
      "guide": "Unlocked after achieving 100% completion across all realms and collecting all other 36 trophies."
    },
    {
      "id": "gow-02",
      "name": "Last Wish",
      "tier": "gold",
      "tag": "Story",
      "description": "Spread the ashes from the highest peak in Jotunheim.",
      "guide": "Complete the main narrative questline and reach the final sanctuary in Jotunheim."
    },
    {
      "id": "gow-03",
      "name": "Chooser of the Slain",
      "tier": "gold",
      "tag": "Combat",
      "description": "Defeat the nine Valkyries.",
      "guide": "Unseal the 8 hidden chambers across Midgard, Alfheim, and Helheim, defeat each Valkyrie, and vanquish Queen Sigrun at the Council of Valkyries."
    },
    {
      "id": "gow-04",
      "name": "Allfather Blinded",
      "tier": "gold",
      "tag": "Collectible",
      "description": "Kill all 51 of Odin's Ravens.",
      "guide": "Listen for their crystalline screeching throughout all realms and throw the Leviathan Axe to shatter each green spectral raven."
    },
    {
      "id": "gow-05",
      "name": "Fire and Brimstone",
      "tier": "silver",
      "tag": "Combat",
      "description": "Complete all trials of Muspelheim.",
      "guide": "Collect 4 Muspelheim language ciphers and defeat all 6 arena trials up to the summit."
    },
    {
      "id": "gow-06",
      "name": "Darkness and Fog",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Retrieve all treasure from the Workshop’s center chamber in Niflheim.",
      "guide": "Farm Mist Echoes in the shifting maze of Niflheim to open all 5 realm chests and close the 3 Realm Tears."
    }
  ],
  "bloodborne": [
    {
      "id": "bb-01",
      "name": "Bloodborne",
      "tier": "platinum",
      "tag": "Story",
      "description": "All trophies acquired. Hats off!",
      "guide": "Master the nightmare and unlock all other 33 trophies."
    },
    {
      "id": "bb-02",
      "name": "Childhood's Beginning",
      "tier": "gold",
      "tag": "Story",
      "description": "You became an infant Great One, lifting humanity into its next childhood.",
      "guide": "Consume 3 One Third of Umbilical Cords, reject Gehrman, and defeat Moon Presence."
    },
    {
      "id": "bb-03",
      "name": "Honoring Wishes",
      "tier": "gold",
      "tag": "Story",
      "description": "Captivated by the moon presence, you pledge to sustain the hunter’s dream.",
      "guide": "Refuse Gehrman’s offer and defeat him without consuming 3 Umbilical Cords."
    },
    {
      "id": "bb-04",
      "name": "Yharnam Sunrise",
      "tier": "gold",
      "tag": "Story",
      "description": "You lived through the hunt, and saw another daybreak.",
      "guide": "Accept Gehrman’s offer at the foot of the great tree in Hunter’s Dream."
    },
    {
      "id": "bb-05",
      "name": "Yharnam, Pthumerian Queen",
      "tier": "gold",
      "tag": "Combat",
      "description": "Defeat Yharnam, Blood Queen of the Old Labyrinth.",
      "guide": "Progress through Pthumeru Chalice Dungeons to layer 3 of Great Pthumeru Ihyll Chalice and vanquish the Queen."
    },
    {
      "id": "bb-06",
      "name": "Hunter's Essence",
      "tier": "gold",
      "tag": "Collectible",
      "description": "Acquire all hunter weapons.",
      "guide": "Collect all 26 trick weapons and firearms in the base game (including Burial Blade and Blade of Mercy)."
    }
  ],
  "spiderman-remastered": [
    {
      "id": "sp-01",
      "name": "Be Greater",
      "tier": "platinum",
      "tag": "Story",
      "description": "Collect all trophies.",
      "guide": "Awarded when all Manhattan districts reach 100% and story/side missions are finished."
    },
    {
      "id": "sp-02",
      "name": "Superior Spider-Man",
      "tier": "gold",
      "tag": "Collectible",
      "description": "Unlock all skills.",
      "guide": "Reach max player level 50 and spend skill points across Innovator, Web-Slinger, and Defender skill trees."
    },
    {
      "id": "sp-03",
      "name": "I Love Manhattan",
      "tier": "gold",
      "tag": "Collectible",
      "description": "100% complete all districts.",
      "guide": "Finish all crimes, Fisk hideouts, demon warehouses, research stations, and backpack collections in every district."
    },
    {
      "id": "sp-04",
      "name": "A Suit For All Seasons",
      "tier": "silver",
      "tag": "Collectible",
      "description": "Purchase all suits.",
      "guide": "Spend challenge, base, crime, and backpack tokens to unlock all standard suits at the crafting menu."
    },
    {
      "id": "sp-05",
      "name": "Cat’s Out of the Bag",
      "tier": "bronze",
      "tag": "Story",
      "description": "Find Black Cat collectibles.",
      "guide": "Track down all surveillance stakeouts left across the city by Black Cat."
    }
  ]
};

function getBundledTrophies(id){ return (TROPHY_DATABASE && TROPHY_DATABASE[id]) ? TROPHY_DATABASE[id] : []; }
