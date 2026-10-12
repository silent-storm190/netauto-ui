// Separate endpoint response supplied by the user. Preserve raw route strings,
// repeated hops and intermediate nodes; do not merge this into the SNMP response.
window.NETAUTO_DROP_POINT_UPLINK_RESPONSE = {
  "success": true,
  "payload": [
    {
      "description": "Ha Noi",
      "name_branch": "Chi nhánh Hà Nội 11 (HN11)",
      "tap_diem": "HNIP246.0096/HO",
      "pop": "HNIP246",
      "bcc2_and_uplink_parameters": [
        {
          "bcc2": "HNIP246.0096/HO.01",
          "uplink_parameters": "HNIP246.0162/HO/7=>HNIP246.0017/CO/4=>HNIP246.0017/HO/4=>Trung Gian/4=>HNIP246.0017/HO/4=>HNIP246.0054/CO/2=>HNIP246.0054/HO/2=>Trung Gian/2=>HNIP246.0054/HO/2=>HNIP246.0096/CO/1=>HNIP246.0096/HO/1"
        },
        {
          "bcc2": "HNIP246.0096/HO.02",
          "uplink_parameters": "HNIP246.0162/HO/10=>HNIP246.0017/CO/7=>HNIP246.0017/HO/7=>Trung Gian/7=>HNIP246.0017/HO/7=>HNIP246.0054/CO/5=>HNIP246.0054/HO/5=>Trung Gian/5=>HNIP246.0054/HO/5=>HNIP246.0096/CO/3=>HNIP246.0096/HO/2"
        }
      ]
    }
  ]
};
