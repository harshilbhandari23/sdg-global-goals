/* Shared SDG data used by every page script. */
window.SDG = {
  names: ["No Poverty","Zero Hunger","Good Health and Well-being","Quality Education","Gender Equality","Clean Water and Sanitation","Affordable and Clean Energy","Decent Work and Economic Growth","Industry, Innovation and Infrastructure","Reduced Inequalities","Sustainable Cities and Communities","Responsible Consumption and Production","Climate Action","Life Below Water","Life on Land","Peace, Justice and Strong Institutions","Partnerships for the Goals"],
  colors: ["#E5243B","#DDA63A","#4C9F38","#C5192D","#FF3A21","#26BDE2","#FCC30B","#A21942","#FD6925","#DD1367","#FD9D24","#BF8B2E","#3F7E44","#0A97D9","#56C02B","#00689D","#19486A"],
  // angle (deg, 0 = right, clockwise) of each goal around the 318px wheel
  angles: {1:66.6,2:45.9,3:25.0,4:5.2,5:343.4,6:322.1,7:300.7,8:279.6,9:258.2,10:237.3,11:215.9,12:194.8,13:173.1,14:151.9,15:130.6,16:109.4,17:90.0},
  goalPath: function (n) { return (window.SITE_ROOT || "") + "global_goals/goal-" + n + "/"; },
  tile: function (n) { return "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-" + String(n).padStart(2, "0") + ".jpg"; },
  get logo() { return (window.SITE_ROOT || "") + "assets/media/kF4OY4yJJConof15nyiHGYO9M.png"; },
  // CMS "SDG Goals Yearwise" collection, copied to JSON (edit data/yearwise.json to update)
};
