// Here all versions are located, the same as app.js but this time its apps.js because all versions info is located in this one file
// To add more versions, copy the versions.v1 and replace with versions.v2, and the same with others (it support more than 9 versions)

versions.v1 = {
  name: "Template",
  version: "temp01",
  date: "2025",
  folder: "asset-v1/",
  ambience: "",
  looptime: 8000,
  bpm: 120,
  totalframe: 384,
  nbpolo: 7,
  maxrecloop: 24,
  bonusloopA: false, 
  bonusendloopA: true,
  colBck: "#D8A365",
  col0: "#D8A365",
  col1: "#A16224",
  col2: "#BA7B3D",
  col3: "#6A3501",
  col4: "#422101",
  animearray: [
    {name:"drum1_kick",color:"E5A90E",uniqsnd:!1},{name:"drum2_snare",color:"E5A90E",uniqsnd:!1},{name:"drum3_touti",color:"E5A90E",uniqsnd:!0},{name:"drum4_charley",color:"E5A90E",uniqsnd:!0},{name:"drum5_chatom",color:"E5A90E",uniqsnd:!1},{name:"effect1_bass",color:"0CB6CB",uniqsnd:!1},{name:"effect2_enigmatic",color:"0CB6CB",uniqsnd:!0},{name:"effect3_cry",color:"0CB6CB",uniqsnd:!0},{name:"effect4_odoyouno",color:"0CB6CB",uniqsnd:!0},{name:"effect5_oua",color:"0CB6CB",uniqsnd:!0},{name:"melo1_toun",color:"F42828",uniqsnd:!1},{name:"melo2_flute",color:"F42828",uniqsnd:!1},{name:"melo3_neou",color:"F42828",uniqsnd:!1},{name:"melo4_hu",color:"F42828",uniqsnd:!0},{name:"melo5_ah",color:"F42828",uniqsnd:!0},{name:"chips1_feel",color:"787DFF",uniqsnd:!1},{name:"chips2_chillin",color:"787DFF",uniqsnd:!0},{name:"chips3_yeah",color:"787DFF",uniqsnd:!0},{name:"chips4_filback",color:"787DFF",uniqsnd:!1},{name:"chips5_teylo",color:"787DFF",uniqsnd:!0},
  ],
  bonusarray: [
    {
      name: "Baby",
      src: "v4-b1",
      code: "1,2,6,11,17",
      sound: "bonus-love",
      aspire: "aspire",
      expire: "",
      icon: "icon.svg",
      loop: 1,
    },
    {
      name: "Follow",
      src: "v4-b2",
      code: "1,6,8,12,18",
      sound: "bonus-follow",
      aspire: "aspire",
      expire: "",
      icon: "icon-2.svg",
      loop: 1,
    },
    {
      name: "Eagle",
      src: "v4-b3",
      code: "1,3,6,13,16",
      sound: "bonus-eagle",
      aspire: "aspire",
      expire: "",
      icon: "icon-3.svg",
      loop: 1,
    },
  ],
};

// versions.v2 = {
//  name: "New Version",
// version: "2",
// date: "2025",
// ...
