// Additional Proglog catalog entries.
// These entries provide more searchable games immediately; trophy lists are marked
// as catalog previews unless a verified complete set is bundled in catalog.js.
(function () {
  'use strict';
  var extras = [
    {id:'god-of-war-ragnarok',title:'God of War Ragnarök',platform:'playstation',color:'#16a66f',roadmap:{difficulty:'4/10',difficultyLabel:'Moderate',time:'50–60 Hours',playthroughs:'1 Playthrough',missable:'0 Missable',summary:'Explore the Nine Realms, complete the main story, favors, berserker fights, collectibles, and realm activities.'},totalTrophies:48},
    {id:'horizon-forbidden-west',title:'Horizon Forbidden West',platform:'playstation',color:'#22c7b7',roadmap:{difficulty:'4/10',difficultyLabel:'Moderate',time:'55–70 Hours',playthroughs:'1 Playthrough',missable:'0 Missable',summary:'Explore the Forbidden West, complete story and side content, machine challenges, collectibles, and the Cauldron network.'},totalTrophies:80},
    {id:'spider-man-2',title:"Marvel's Spider-Man 2",platform:'playstation',color:'#f43f5e',roadmap:{difficulty:'3/10',difficultyLabel:'Easy',time:'30–40 Hours',playthroughs:'1 Playthrough',missable:'0 Missable',summary:'Swing across New York, complete the story, side missions, activities, and suit upgrades.'},totalTrophies:43},
    {id:'resident-evil-4-remake',title:'Resident Evil 4',platform:'playstation',color:'#f97316',roadmap:{difficulty:'7/10',difficultyLabel:'Challenging',time:'45–70 Hours',playthroughs:'Multiple',missable:'Several',summary:'Survive the village, castle, and island across multiple difficulty and challenge runs.'},totalTrophies:46},
    {id:'astro-playroom',title:"ASTRO's PLAYROOM",platform:'playstation',color:'#38bdf8',roadmap:{difficulty:'2/10',difficultyLabel:'Easy',time:'5–7 Hours',playthroughs:'1 Playthrough',missable:'0 Missable',summary:'Explore four worlds, discover PlayStation references, collect puzzle pieces, artifacts, and complete the speedrun challenges.'},totalTrophies:46},
    {id:'hades',title:'Hades',platform:'steam',color:'#f59e0b',roadmap:{difficulty:'6/10',difficultyLabel:'Challenging',time:'40–60 Hours',playthroughs:'Many Runs',missable:'0 Missable',summary:'Escape Tartarus, Asphodel, Elysium, and the Temple while completing relationships, prophecies, and weapon milestones.'},totalTrophies:49},
    {id:'hollow-knight',title:'Hollow Knight',platform:'steam',color:'#64748b',roadmap:{difficulty:'9/10',difficultyLabel:'Hard',time:'40–80 Hours',playthroughs:'1 Save',missable:'Few',summary:'Explore Hallownest, defeat its bosses, discover its secrets, and complete the Pantheons and endings.'},totalTrophies:63},
    {id:'cyberpunk-2077-ps5',title:'Cyberpunk 2077',platform:'playstation',color:'#fbbf24',roadmap:{difficulty:'3/10',difficultyLabel:'Moderate',time:'60–75 Hours',playthroughs:'1 Playthrough',missable:'Some',summary:'Explore Night City, complete gigs, endings, cyberware builds, and major side stories.'},totalTrophies:57},
    {id:'stray',title:'Stray',platform:'playstation',color:'#f97316',roadmap:{difficulty:'3/10',difficultyLabel:'Easy',time:'8–10 Hours',playthroughs:'1 Playthrough',missable:'Several',summary:'Guide the stray through the walled city, find collectibles, and complete the story and exploration challenges.'},totalTrophies:24},
    {id:'death-stranding',title:'Death Stranding',platform:'playstation',color:'#8b5cf6',roadmap:{difficulty:'5/10',difficultyLabel:'Moderate',time:'60–90 Hours',playthroughs:'1 Playthrough',missable:'0 Missable',summary:'Reconnect America, complete deliveries, build infrastructure, and develop relationships across the UCA.'},totalTrophies:63}
  ];
  extras.forEach(function (g) {
    g.achievements = g.achievements || [];
    g.catalogPreview = true;
    if (typeof GAME_CATALOG !== 'undefined' && !GAME_CATALOG.some(function(x){return x.id===g.id;})) GAME_CATALOG.push(g);
  });
})();
