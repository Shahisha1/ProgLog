// Game details and trophy database
var GAME_DETAILS = {
  "tlou-part-1": {
    "title": "The Last of Us Part I",
    "platform": "playstation",
    "counts": {
      "total": 29,
      "platinum": 1,
      "gold": 7,
      "silver": 7,
      "bronze": 14
    },
    "release": "Sep 2, 2022",
    "completion": "15–20 hours",
    "base": 29,
    "dlc": 0,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/The-Last-of-Us-Part-I/trophies",
    "guideUrl": "https://www.truetrophies.com/game/The-Last-of-Us-Part-I/walkthrough",
    "description": "Survival-horror action adventure rebuilt from the ground up, including the Left Behind story."
  },
  "ghost-of-tsushima": {
    "title": "Ghost of Tsushima",
    "platform": "playstation",
    "counts": {
      "total": 77,
      "platinum": 1,
      "gold": 4,
      "silver": 13,
      "bronze": 59
    },
    "release": "Aug 20, 2021",
    "completion": "40–50 hours (base)",
    "base": 52,
    "dlc": 25,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/Ghost-of-Tsushima/trophies",
    "guideUrl": "https://www.truetrophies.com/game/Ghost-of-Tsushima/walkthrough",
    "description": "Open-world action adventure set in feudal Japan, including Legends and Iki Island content."
  },
  "elden-ring": {
    "title": "ELDEN RING",
    "platform": "playstation",
    "counts": {
      "total": 42,
      "platinum": 1,
      "gold": 3,
      "silver": 14,
      "bronze": 24
    },
    "release": "Feb 25, 2022",
    "completion": "100–120 hours",
    "base": 42,
    "dlc": 0,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/Elden-Ring/trophies",
    "guideUrl": "https://www.truetrophies.com/game/Elden-Ring/walkthrough",
    "description": "FromSoftware open-world action RPG focused on exploration, bosses and multiple endings."
  },
  "cyberpunk-2077": {
    "title": "Cyberpunk 2077",
    "platform": "steam",
    "counts": {
      "total": 57
    },
    "release": "Dec 10, 2020",
    "completion": "80–100 hours (base)",
    "base": 44,
    "dlc": 13,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Cyberpunk-2077/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Cyberpunk-2077/walkthrough",
    "description": "Steam achievement set for Night City, including Phantom Liberty."
  },
  "god-of-war-2018": {
    "title": "God of War",
    "platform": "playstation",
    "counts": {
      "total": 37,
      "platinum": 1,
      "gold": 5,
      "silver": 9,
      "bronze": 22
    },
    "release": "Apr 20, 2018",
    "completion": "40–50 hours",
    "base": 37,
    "dlc": 0,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/God-of-War-PS4/trophies",
    "guideUrl": "https://www.truetrophies.com/game/God-of-War-PS4/walkthrough",
    "description": "Kratos and Atreus journey through Norse realms in a story-driven action adventure."
  },
  "bloodborne": {
    "title": "Bloodborne",
    "platform": "playstation",
    "counts": {
      "total": 40,
      "platinum": 1,
      "gold": 7,
      "silver": 8,
      "bronze": 24
    },
    "release": "Mar 25, 2015",
    "completion": "60–80 hours",
    "base": 34,
    "dlc": 6,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/Bloodborne/trophies",
    "guideUrl": "https://www.truetrophies.com/game/Bloodborne/walkthrough",
    "description": "Gothic action RPG built around aggressive combat, exploration and challenging bosses."
  },
  "spiderman-remastered": {
    "title": "Marvel's Spider-Man Remastered",
    "platform": "playstation",
    "counts": {
      "total": 79,
      "platinum": 1,
      "gold": 5,
      "silver": 19,
      "bronze": 54
    },
    "release": "Nov 12, 2020",
    "completion": "20–25 hours (base)",
    "base": 51,
    "dlc": 28,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/Marvels-SpiderMan-Remastered/trophies",
    "guideUrl": "https://www.truetrophies.com/game/Marvels-SpiderMan-Remastered/walkthrough",
    "description": "Swing through Manhattan, complete the story, districts and five extra trophy groups."
  },
  "god-of-war-ragnarok": {
    "title": "God of War Ragnarök",
    "platform": "playstation",
    "counts": {
      "total": 48,
      "platinum": 1,
      "gold": 4,
      "silver": 16,
      "bronze": 27
    },
    "release": "Nov 9, 2022",
    "completion": "40–50 hours (base)",
    "base": 36,
    "dlc": 12,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/God-of-War-Ragnarok-PS4/trophies",
    "guideUrl": "https://www.truetrophies.com/game/God-of-War-Ragnarok-PS4/walkthrough",
    "description": "A cinematic Norse adventure spanning all nine realms, plus Valhalla content."
  },
  "horizon-forbidden-west": {
    "title": "Horizon Forbidden West",
    "platform": "playstation",
    "counts": {
      "total": 80,
      "platinum": 1,
      "gold": 2,
      "silver": 10,
      "bronze": 67
    },
    "release": "Feb 18, 2022",
    "completion": "60–80 hours (base)",
    "base": 59,
    "dlc": 21,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/Horizon-Forbidden-West/trophies",
    "guideUrl": "https://www.truetrophies.com/game/Horizon-Forbidden-West/walkthrough",
    "description": "Open-world machine hunting adventure across the Forbidden West and Burning Shores."
  },
  "spider-man-2": {
    "title": "Marvel's Spider-Man 2",
    "platform": "playstation",
    "counts": {
      "total": 43,
      "platinum": 1,
      "gold": 2,
      "silver": 18,
      "bronze": 22
    },
    "release": "Oct 20, 2023",
    "completion": "25–30 hours (base)",
    "base": 42,
    "dlc": 1,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/Marvels-SpiderMan-2/trophies",
    "guideUrl": "https://www.truetrophies.com/game/Marvels-SpiderMan-2/walkthrough",
    "description": "Peter Parker and Miles Morales protect New York across story missions and side activities."
  },
  "resident-evil-4-remake": {
    "title": "Resident Evil 4",
    "platform": "playstation",
    "counts": {
      "total": 47,
      "platinum": 1,
      "gold": 5,
      "silver": 11,
      "bronze": 30
    },
    "release": "Mar 24, 2023",
    "completion": "50–60 hours (base)",
    "base": 40,
    "dlc": 7,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/Resident-Evil-4/trophies",
    "guideUrl": "https://www.truetrophies.com/game/Resident-Evil-4/walkthrough",
    "description": "Third-person survival horror remake with multiple difficulty and Separate Ways content."
  },
  "astro-playroom": {
    "title": "ASTRO's PLAYROOM",
    "platform": "playstation",
    "counts": {
      "total": 51,
      "platinum": 1,
      "gold": 5,
      "silver": 14,
      "bronze": 31
    },
    "release": "Nov 12, 2020",
    "completion": "4–5 hours (base)",
    "base": 43,
    "dlc": 8,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/Astros-Playroom/trophies",
    "guideUrl": "https://www.truetrophies.com/game/Astros-Playroom/walkthrough",
    "description": "A compact PlayStation showcase packed with platforming, artifacts and references."
  },
  "hades": {
    "title": "Hades",
    "platform": "steam",
    "counts": {
      "total": 49
    },
    "release": "Sep 17, 2020",
    "completion": "40–60 hours",
    "base": 49,
    "dlc": 0,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Hades/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Hades/walkthrough",
    "description": "Steam achievement set for Supergiant Games’ Underworld roguelite."
  },
  "hollow-knight": {
    "title": "Hollow Knight",
    "platform": "steam",
    "counts": {
      "total": 63
    },
    "release": "Feb 24, 2017",
    "completion": "60–80 hours (base)",
    "base": 52,
    "dlc": 11,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Hollow-Knight/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Hollow-Knight/walkthrough",
    "description": "Steam achievement set covering the base game and three achievement-bearing DLC packs."
  },
  "cyberpunk-2077-ps5": {
    "title": "Cyberpunk 2077",
    "platform": "playstation",
    "counts": {
      "total": 58,
      "platinum": 1,
      "gold": 1,
      "silver": 17,
      "bronze": 39
    },
    "release": "Dec 10, 2020",
    "completion": "75–100 hours",
    "base": 45,
    "dlc": 13,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/Cyberpunk-2077/trophies",
    "guideUrl": "https://www.truetrophies.com/game/Cyberpunk-2077/walkthrough",
    "description": "PlayStation trophy set for Night City, including Phantom Liberty."
  },
  "stray": {
    "title": "Stray",
    "platform": "playstation",
    "counts": {
      "total": 25,
      "platinum": 1,
      "gold": 7,
      "silver": 9,
      "bronze": 8
    },
    "release": "Jul 19, 2022",
    "completion": "6–8 hours",
    "base": 25,
    "dlc": 0,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/Stray-PS4/trophies",
    "guideUrl": "https://www.truetrophies.com/game/Stray-PS4/walkthrough",
    "description": "Explore a forgotten cybercity as a stray cat with B-12."
  },
  "death-stranding": {
    "title": "DEATH STRANDING",
    "platform": "playstation",
    "counts": {
      "total": 63,
      "platinum": 1,
      "gold": 1,
      "silver": 2,
      "bronze": 59
    },
    "release": "Nov 8, 2019",
    "completion": "80–100 hours",
    "base": 63,
    "dlc": 0,
    "source": "TrueTrophies",
    "sourceUrl": "https://www.truetrophies.com/game/DEATH-STRANDING/trophies",
    "guideUrl": "https://www.truetrophies.com/game/DEATH-STRANDING/walkthrough",
    "description": "Open-world delivery adventure about reconnecting a fractured America."
  },
  "grand-theft-auto-v": {
    "title": "Grand Theft Auto V",
    "platform": "steam",
    "counts": {
      "total": 77
    },
    "release": "Apr 14, 2015",
    "completion": "200+ hours",
    "base": 69,
    "dlc": 8,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Grand-Theft-Auto-V/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Grand-Theft-Auto-V/walkthrough",
    "description": "Story-driven open-world crime sandbox set in Los Santos and Blaine County."
  },
  "fallout-4": {
    "title": "Fallout 4",
    "platform": "steam",
    "counts": {
      "total": 84
    },
    "release": "Nov 10, 2015",
    "completion": "80–100 hours (base)",
    "base": 50,
    "dlc": 34,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Fallout-4/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Fallout-4/walkthrough",
    "description": "Post-apocalyptic open-world RPG with settlements, factions and extensive DLC."
  },
  "stardew-valley": {
    "title": "Stardew Valley",
    "platform": "steam",
    "counts": {
      "total": 49
    },
    "release": "Feb 26, 2016",
    "completion": "150–200 hours",
    "base": 40,
    "dlc": 9,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Stardew-Valley/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Stardew-Valley/walkthrough",
    "description": "Farm, fish, mine and build relationships in a handcrafted valley."
  },
  "celeste": {
    "title": "Celeste",
    "platform": "steam",
    "counts": {
      "total": 32
    },
    "release": "Jan 25, 2018",
    "completion": "40–50 hours",
    "base": 32,
    "dlc": 0,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Celeste/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Celeste/walkthrough",
    "description": "Precision platformer about climbing Celeste Mountain."
  },
  "baldurs-gate-3": {
    "title": "Baldur's Gate 3",
    "platform": "steam",
    "counts": {
      "total": 54
    },
    "release": "Aug 3, 2023",
    "completion": "200+ hours",
    "base": 54,
    "dlc": 0,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Baldurs-Gate-3/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Baldurs-Gate-3/walkthrough",
    "description": "Choice-driven RPG with turn-based combat, companions and branching outcomes."
  },
  "skyrim": {
    "title": "The Elder Scrolls V: Skyrim",
    "platform": "steam",
    "counts": {
      "total": 75
    },
    "release": "Nov 10, 2011",
    "completion": "200+ hours",
    "base": 50,
    "dlc": 25,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/The-Elder-Scrolls-V-Skyrim/achievements",
    "guideUrl": "https://truesteamachievements.com/game/The-Elder-Scrolls-V-Skyrim/walkthrough",
    "description": "Open-world fantasy RPG with three major expansions and hundreds of quests."
  },
  "doom-2016": {
    "title": "DOOM",
    "platform": "steam",
    "counts": {
      "total": 54
    },
    "release": "May 13, 2016",
    "completion": "20–25 hours (base)",
    "base": 36,
    "dlc": 18,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/DOOM/achievements",
    "guideUrl": "https://truesteamachievements.com/game/DOOM/walkthrough",
    "description": "Fast, aggressive first-person shooter with campaign, multiplayer and SnapMap."
  },
  "vampire-survivors": {
    "title": "Vampire Survivors",
    "platform": "steam",
    "counts": {
      "total": 243
    },
    "release": "Dec 17, 2022",
    "completion": "6–8 hours (base)",
    "base": 24,
    "dlc": 219,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Vampire-Survivors/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Vampire-Survivors/walkthrough",
    "description": "Reverse bullet-hell survival game with a huge set of free updates and paid DLC."
  },
  "hades-steam": {
    "title": "Hades",
    "platform": "steam",
    "counts": {
      "total": 49
    },
    "release": "Sep 17, 2020",
    "completion": "40–60 hours",
    "base": 49,
    "dlc": 0,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Hades/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Hades/walkthrough",
    "description": "Steam achievement set for Supergiant Games’ Underworld roguelite."
  },
  "hollow-knight-steam": {
    "title": "Hollow Knight",
    "platform": "steam",
    "counts": {
      "total": 63
    },
    "release": "Feb 24, 2017",
    "completion": "60–80 hours (base)",
    "base": 52,
    "dlc": 11,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Hollow-Knight/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Hollow-Knight/walkthrough",
    "description": "Steam achievement set covering the base game and three achievement-bearing DLC packs."
  },
  "cyberpunk-2077-steam": {
    "title": "Cyberpunk 2077",
    "platform": "steam",
    "counts": {
      "total": 57
    },
    "release": "Dec 10, 2020",
    "completion": "80–100 hours (base)",
    "base": 44,
    "dlc": 13,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/Cyberpunk-2077/achievements",
    "guideUrl": "https://truesteamachievements.com/game/Cyberpunk-2077/walkthrough",
    "description": "Steam achievement set for Night City, including the Phantom Liberty DLC."
  },
  "death-stranding-steam": {
    "title": "DEATH STRANDING",
    "platform": "steam",
    "counts": {
      "total": 63
    },
    "release": "Jul 14, 2020",
    "completion": "80–100 hours",
    "base": 63,
    "dlc": 0,
    "source": "TrueSteamAchievements",
    "sourceUrl": "https://truesteamachievements.com/game/DEATH-STRANDING/achievements",
    "guideUrl": "https://truesteamachievements.com/game/DEATH-STRANDING/walkthrough",
    "description": "Steam achievement set for the original DEATH STRANDING."
  }
};

function getGameDetails(id){ return (typeof GAME_DETAILS !== 'undefined' && GAME_DETAILS[id]) ? GAME_DETAILS[id] : null; }
