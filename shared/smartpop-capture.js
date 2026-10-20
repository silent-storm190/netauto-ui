/* Original recorded Socket.IO payloads. Snapshot only; never a live subscription. */
window.NETAUTO_SMARTPOP_CAPTURE = {
  "label": "172.18.86.217",
  "frames": [
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/rs485_devices",
        "message": {
          "cmd": "OPMS_REPORT_RS485_RUNTIME",
          "contain": {
            "rs485_devices": [
              {
                "connection_status": 1,
                "id": 1,
                "model": "CAC",
                "model_name": "CAC",
                "name": "Cabinet Air Conditioner",
                "regs": [
                  100,
                  1,
                  1,
                  1,
                  0,
                  0,
                  65535,
                  41.8,
                  200,
                  49.9,
                  41,
                  120,
                  200,
                  32767,
                  0,
                  65535,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  15,
                  3,
                  14,
                  5,
                  60,
                  10,
                  61,
                  3,
                  90,
                  10,
                  1
                ]
              },
              {
                "connection_status": 1,
                "id": 6,
                "model": "PINCOSLIGHT",
                "model_name": "PINCOSLIGHT",
                "name": "PIN1",
                "regs": [
                  53.08,
                  52.96,
                  0,
                  0,
                  50,
                  48.08,
                  96,
                  100,
                  34,
                  34,
                  3547,
                  3524,
                  65535,
                  1440,
                  7,
                  7,
                  3534,
                  3526,
                  3533,
                  3524,
                  3531,
                  3544,
                  3539,
                  3544,
                  3545,
                  3544,
                  3546,
                  3544,
                  3547,
                  3545,
                  3542,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0
                ]
              },
              {
                "connection_status": 2,
                "id": 5,
                "model": "PINCOSLIGHT",
                "model_name": "PINCOSLIGHT",
                "name": "PIN2",
                "regs": [
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535
                ]
              }
            ]
          },
          "ts": 1792481852
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/information",
        "message": {
          "cmd": "OPMS_REPORT_INFO_POP",
          "contain": {
            "informations": {
              "gateway": {
                "fw_version": "v3.3",
                "hw_version": "TinkerBoardR2",
                "kernel": "5.15.80-rockchip",
                "network": {
                  "IP": "172.18.86.217",
                  "MAC": "581122e3b62c2001"
                }
              },
              "slave": {
                "connected": 1,
                "error": {
                  "battery": 1,
                  "firmware": 1,
                  "flash": 1
                },
                "fw_version": "v3.3",
                "hw_version": "v1.6"
              }
            }
          },
          "ts": 1792481859
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/sensor",
        "message": {
          "cmd": "OPMS_REPORT_INFO_SENSOR",
          "contain": {
            "control_ac": 1,
            "control_fan_pop": [
              100,
              100,
              100,
              100
            ],
            "control_ouput": [
              2,
              2,
              1,
              0
            ],
            "control_power_rs485": [
              1,
              0
            ],
            "current_ac": 229,
            "current_output": [
              0,
              0,
              0,
              0
            ],
            "current_power_rs485": [
              0,
              0
            ],
            "humidity": [
              54,
              255
            ],
            "input": [
              2,
              2,
              2,
              1,
              1,
              2,
              1,
              1
            ],
            "mode": 1,
            "power_rs485_pg": 1,
            "rps_fan_cooling": [
              107,
              120,
              0
            ],
            "rps_fan_pop": [
              61,
              49,
              49,
              0
            ],
            "state": 2,
            "temperature": [
              44,
              36,
              44,
              40
            ]
          },
          "ts": 1792481866
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/convert/sensor",
        "message": {
          "cmd": "OPMS_REPORT_INFO_SENSOR_SORTED",
          "contain": {
            "control_ac": 1,
            "control_fan_pop": [
              100,
              100,
              100,
              100
            ],
            "control_ouput": [
              2,
              2,
              1,
              0
            ],
            "control_power_rs485": [
              1,
              0
            ],
            "current_ac": 229,
            "current_output": [
              0,
              0,
              0,
              0
            ],
            "current_power_rs485": [
              0,
              0
            ],
            "humidity": [
              54,
              255
            ],
            "input": [
              2,
              2,
              2,
              1,
              1,
              2,
              1,
              1
            ],
            "mode": 1,
            "power_rs485_pg": 1,
            "rps_fan_cooling": [
              107,
              120,
              0
            ],
            "rps_fan_pop": [
              61,
              49,
              49,
              0
            ],
            "state": 2,
            "temperature": [
              44,
              36,
              44,
              40
            ]
          },
          "ts": 1792481866
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/console",
        "message": {
          "cmd": "OPMS_REPORT_TOTAL_CONSOLE",
          "contain": {
            "console": 2
          },
          "ts": 1792481870
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/rs485_devices",
        "message": {
          "cmd": "OPMS_REPORT_RS485_RUNTIME",
          "contain": {
            "rs485_devices": [
              {
                "connection_status": 1,
                "id": 1,
                "model": "CAC",
                "model_name": "CAC",
                "name": "Cabinet Air Conditioner",
                "regs": [
                  100,
                  1,
                  1,
                  1,
                  0,
                  0,
                  65535,
                  43.9,
                  200,
                  49.2,
                  41.1,
                  120,
                  200,
                  32767,
                  0,
                  65535,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  15,
                  3,
                  14,
                  5,
                  60,
                  10,
                  61,
                  3,
                  90,
                  10,
                  1
                ]
              },
              {
                "connection_status": 1,
                "id": 6,
                "model": "PINCOSLIGHT",
                "model_name": "PINCOSLIGHT",
                "name": "PIN1",
                "regs": [
                  53.08,
                  52.96,
                  0,
                  0,
                  50,
                  48.08,
                  96,
                  100,
                  34,
                  34,
                  3547,
                  3524,
                  65535,
                  1440,
                  7,
                  7,
                  3534,
                  3526,
                  3533,
                  3524,
                  3528,
                  3543,
                  3539,
                  3544,
                  3545,
                  3544,
                  3547,
                  3544,
                  3547,
                  3545,
                  3544,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0
                ]
              },
              {
                "connection_status": 2,
                "id": 5,
                "model": "PINCOSLIGHT",
                "model_name": "PINCOSLIGHT",
                "name": "PIN2",
                "regs": [
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535
                ]
              }
            ]
          },
          "ts": 1792481873
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/information",
        "message": {
          "cmd": "OPMS_REPORT_INFO_POP",
          "contain": {
            "informations": {
              "gateway": {
                "fw_version": "v3.3",
                "hw_version": "TinkerBoardR2",
                "kernel": "5.15.80-rockchip",
                "network": {
                  "IP": "172.18.86.217",
                  "MAC": "581122e3b62c2001"
                }
              },
              "slave": {
                "connected": 1,
                "error": {
                  "battery": 1,
                  "firmware": 1,
                  "flash": 1
                },
                "fw_version": "v3.3",
                "hw_version": "v1.6"
              }
            }
          },
          "ts": 1792481880
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/alarm",
        "message": {
          "cmd": "OPMS_REPORT_ALARM",
          "ts": 1792481887,
          "contain": {
            "service_alarm": [
              {
                "slot": 1,
                "name": "01_0_OPMS_Gateway",
                "alarm_code": 0,
                "time": {
                  "last_change": 1787306457,
                  "last_check": 1792481847
                },
                "msg": "OK - CPU:9%, MEM:10%, TEMP:55, GW_HWV:TINKERBOARDR2, GW_FWV:V3.3; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 2,
                "name": "01_1_OPMS_Fans",
                "alarm_code": 0,
                "time": {
                  "last_change": 1766636124,
                  "last_check": 1792481848
                },
                "msg": "OK - OPMS_FAN1: 110rps, 100%; OPMS_FAN2: 106rps, 100%; OPMS_FAN3: 0rps, 100%; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 3,
                "name": "02_0_OPMS_ACC_Status",
                "alarm_code": 1,
                "time": {
                  "last_change": 1792464950,
                  "last_check": 1792481850
                },
                "msg": "WARNING - CONTROL_STATE: CRITICAL; --INFO-- SLAVE_BOARD: CONNECTED, CONTROL_MODE: AUTO, SL_HWV:V1.6, SL_FWV:V3.3; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 4,
                "name": "02_1_OPMS_ACC_Config",
                "alarm_code": 0,
                "time": {
                  "last_change": 1783538801,
                  "last_check": 1792481852
                },
                "msg": "OK - AIR_CONDITIONER: 1, TEMP_HIGH: 36.0, TEMP_LOW: 30.0, TEMP_CRITICAL: 40.0, TEMP_SAVE_ENERGY: 25.0, HUM_CRITICAL: 75.0; CURRENT: (ACC1:60.0); ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 5,
                "name": "02_2_OPMS_Air_Conditioner",
                "alarm_code": 0,
                "time": {
                  "last_change": 1788346460,
                  "last_check": 1792481855
                },
                "msg": "OK - AC1: ON - 11 days, 5:45:30, 234mA, 44 Celsius; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 6,
                "name": "03_0_OPMS_Pop_Fan_Status",
                "alarm_code": 0,
                "time": {
                  "last_change": 1783538806,
                  "last_check": 1792481857
                },
                "msg": "OK - POP_FAN1: 61rps, 100%; POP_FAN2: 49rps, 100%; POP_FAN3: 49rps, 100%; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 7,
                "name": "04_0_OPMS_TEMPERATURE",
                "alarm_code": 0,
                "time": {
                  "last_change": 1792481785,
                  "last_check": 1792481859
                },
                "msg": "OK - POP_CABINET_TEMP(Khoang_Thiet_Bi):44, EXHAUST_FAN_TEMP(Luoi_loc_gio):36, RETURN_AIR_TEMP(Quat_hut_ML):44, SUPPLY_AIR_TEMP(Hong_gio_ML):38; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 8,
                "name": "05_0_OPMS_INDOOR_HUMIDITY",
                "alarm_code": 0,
                "time": {
                  "last_change": 1783538810,
                  "last_check": 1792481861
                },
                "msg": "OK - POP_HUMIDITY:54%; ",
                "channel": [
                  {
                    "max_alarm_level": "WARNING",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 9,
                "name": "07_0_OPMS_Front_Door",
                "alarm_code": 0,
                "time": {
                  "last_change": 1792113823,
                  "last_check": 1792481862
                },
                "msg": "OK - FRONT_DOOR_CLOSED: 4 days, 6:14:05",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 10,
                "name": "07_1_OPMS_Side_Door",
                "alarm_code": 0,
                "time": {
                  "last_change": 1792154942,
                  "last_check": 1792481863
                },
                "msg": "OK - SIDE_DOOR_CLOSED: 13 days, 23:25:22",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 11,
                "name": "08_0_OPMS_Front_Lamp",
                "alarm_code": 0,
                "time": {
                  "last_change": 1783538814,
                  "last_check": 1792481865
                },
                "msg": "OK - FRONT_LAMP: OFF",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 12,
                "name": "08_1_OPMS_Side_Lamp",
                "alarm_code": 0,
                "time": {
                  "last_change": 1783538815,
                  "last_check": 1792481866
                },
                "msg": "OK - SIDE_LAMP: OFF",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 13,
                "name": "09_0_OPMS_AC_Main_Grid",
                "alarm_code": 0,
                "time": {
                  "last_change": 1783813633,
                  "last_check": 1792481868
                },
                "msg": "OK - MAIN_GRID: CONNECTED",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 14,
                "name": "09_1_OPMS_Generator",
                "alarm_code": 0,
                "time": {
                  "last_change": 1783538818,
                  "last_check": 1792481869
                },
                "msg": "OK - GEN_1: OFF",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 17,
                "name": "11_0_OPMS_Console",
                "alarm_code": 0,
                "time": {
                  "last_change": 1783538820,
                  "last_check": 1792481871
                },
                "msg": "OK - TOTAL: 2 DEVICES; DEV1_CONNECTED, DEV2_CONNECTED; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 18,
                "name": "12_0_OPMS_SPD",
                "alarm_code": 0,
                "time": {
                  "last_change": 1783538822,
                  "last_check": 1792481872
                },
                "msg": "OK - SPD: OK",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 19,
                "name": "13_0_OPMS_ACCU_Vision_info",
                "alarm_code": 0,
                "time": {
                  "last_change": 1792196950,
                  "last_check": 1792481874
                },
                "msg": "OK - PIN1-[ID:6]:(Type:COSLIGHT, Total_Voltage:53.08V, Pack_Voltage:52.96V, CH:0.0A, DCH:0.0A, Rated capacity:50.0Ah, Remaning capacity:48.08Ah, SOC:96.0%, SOH:100.0%, T_max: 34.0C, T_min: 34.0C, Cell_V_max: 3547.0mV, Cell_V_min: 3524.0mV) ; &#8232; &#x2028;",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 20,
                "name": "13_1_OPMS_ACCU_Vision_status",
                "alarm_code": 0,
                "time": {
                  "last_change": 1792196952,
                  "last_check": 1792481875
                },
                "msg": "OK - PIN1-[ID:6]:stand_by; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 21,
                "name": "13_2_OPMS_ACCU_Vision_alarm",
                "alarm_code": 0,
                "time": {
                  "last_change": 1792196953,
                  "last_check": 1792481877
                },
                "msg": "OK - PIN1-[ID:6]:NORMAL; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 22,
                "name": "13_0_OPMS_ACCU_OSN_info",
                "alarm_code": 1,
                "time": {
                  "last_change": 1792196955,
                  "last_check": 1792481878
                },
                "msg": "WARNING - PIN2-[ID:5]_DISCONNECTED --INFO-- PIN1-[ID:6]:(Type:OSN, Volt:53.08V, Current:52.96A, Cycle:50.0, BMS_temp:0.0C, Max_Cell_Temp:0.0C, Full Capacity:48.08Ah, Remain Capacity:96.0Ah, SOC:34.0%, SOH:100.0%); &#8232; &#x2028;",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 23,
                "name": "13_1_OPMS_ACCU_OSN_status",
                "alarm_code": 1,
                "time": {
                  "last_change": 1792196956,
                  "last_check": 1792481880
                },
                "msg": "WARNING - PIN2-[ID:5]_DISCONNECTED --INFO-- PIN1-[ID:6]:stand_by; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 24,
                "name": "13_2_OPMS_ACCU_OSN_alarm",
                "alarm_code": 2,
                "time": {
                  "last_change": 1792196958,
                  "last_check": 1792481881
                },
                "msg": "CRITICAL - PIN1-[ID:6]:(Charging_Over_Current) -- WARNING - PIN2-[ID:5]_DISCONNECTED, PIN1-[ID:6]:(Cell_Over_Voltage, Cell_Low_Voltage, Pack_Low_Voltage, Charging_Over_Current, Charging_High_Temperature, Charging_Low_Temperature, Discharging_Low_Temperature, Over_Voltage, Charger_Over_Voltage, Charging_High_Temperature, Charging_Low_Temperature)",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 27,
                "name": "13_0_OPMS_ACCU_Coslight_info",
                "alarm_code": 1,
                "time": {
                  "last_change": 1792196959,
                  "last_check": 1792481883
                },
                "msg": "WARNING - PIN2-[ID:5]_DISCONNECTED --INFO-- PIN1-[ID:6]:(Type:COSLIGHT, Total_Voltage:53.08V, Pack_Voltage:52.96V, CH:0.0A, DCH:0.0A, Rated capacity:50.0Ah, Remaning capacity:48.08Ah, SOC:96.0%, SOH:100.0%, T_max: 34.0C, T_min: 34.0C, Cell_V_max: 3547.0mV, Cell_V_min: 3524.0mV) ; &#8232; &#x2028;",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 28,
                "name": "13_1_OPMS_ACCU_Coslight_status",
                "alarm_code": 1,
                "time": {
                  "last_change": 1792196961,
                  "last_check": 1792481884
                },
                "msg": "WARNING - PIN2-[ID:5]_DISCONNECTED --INFO-- PIN1-[ID:6]:stand_by; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              },
              {
                "slot": 29,
                "name": "13_2_OPMS_ACCU_Coslight_alarm",
                "alarm_code": 1,
                "time": {
                  "last_change": 1792196962,
                  "last_check": 1792481886
                },
                "msg": "WARNING - PIN2-[ID:5]_DISCONNECTED --INFO-- PIN1-[ID:6]:NORMAL; ",
                "channel": [
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "opsview"
                  },
                  {
                    "max_alarm_level": "CRITICAL",
                    "name": "iot_server"
                  }
                ]
              }
            ]
          }
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/sensor",
        "message": {
          "cmd": "OPMS_REPORT_INFO_SENSOR",
          "contain": {
            "control_ac": 1,
            "control_fan_pop": [
              100,
              100,
              100,
              100
            ],
            "control_ouput": [
              2,
              2,
              1,
              0
            ],
            "control_power_rs485": [
              1,
              0
            ],
            "current_ac": 236,
            "current_output": [
              0,
              0,
              0,
              0
            ],
            "current_power_rs485": [
              0,
              0
            ],
            "humidity": [
              55,
              255
            ],
            "input": [
              2,
              2,
              2,
              1,
              1,
              2,
              1,
              1
            ],
            "mode": 1,
            "power_rs485_pg": 1,
            "rps_fan_cooling": [
              112,
              104,
              0
            ],
            "rps_fan_pop": [
              61,
              49,
              49,
              0
            ],
            "state": 2,
            "temperature": [
              44,
              36,
              44,
              42
            ]
          },
          "ts": 1792481887
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/convert/sensor",
        "message": {
          "cmd": "OPMS_REPORT_INFO_SENSOR_SORTED",
          "contain": {
            "control_ac": 1,
            "control_fan_pop": [
              100,
              100,
              100,
              100
            ],
            "control_ouput": [
              2,
              2,
              1,
              0
            ],
            "control_power_rs485": [
              1,
              0
            ],
            "current_ac": 236,
            "current_output": [
              0,
              0,
              0,
              0
            ],
            "current_power_rs485": [
              0,
              0
            ],
            "humidity": [
              55,
              255
            ],
            "input": [
              2,
              2,
              2,
              1,
              1,
              2,
              1,
              1
            ],
            "mode": 1,
            "power_rs485_pg": 1,
            "rps_fan_cooling": [
              112,
              104,
              0
            ],
            "rps_fan_pop": [
              61,
              49,
              49,
              0
            ],
            "state": 2,
            "temperature": [
              44,
              36,
              44,
              42
            ]
          },
          "ts": 1792481887
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/rs485_devices",
        "message": {
          "cmd": "OPMS_REPORT_RS485_RUNTIME",
          "contain": {
            "rs485_devices": [
              {
                "connection_status": 1,
                "id": 1,
                "model": "CAC",
                "model_name": "CAC",
                "name": "Cabinet Air Conditioner",
                "regs": [
                  100,
                  1,
                  1,
                  1,
                  0,
                  0,
                  65535,
                  44.9,
                  200,
                  47.9,
                  41.1,
                  120,
                  200,
                  32767,
                  0,
                  65535,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  15,
                  3,
                  14,
                  5,
                  60,
                  10,
                  61,
                  3,
                  90,
                  10,
                  1
                ]
              },
              {
                "connection_status": 1,
                "id": 6,
                "model": "PINCOSLIGHT",
                "model_name": "PINCOSLIGHT",
                "name": "PIN1",
                "regs": [
                  53.08,
                  52.96,
                  0,
                  0,
                  50,
                  48.08,
                  96,
                  100,
                  34,
                  34,
                  3547,
                  3524,
                  65535,
                  1440,
                  7,
                  7,
                  3534,
                  3526,
                  3533,
                  3524,
                  3531,
                  3543,
                  3539,
                  3544,
                  3545,
                  3544,
                  3546,
                  3544,
                  3547,
                  3545,
                  3544,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0
                ]
              },
              {
                "connection_status": 2,
                "id": 5,
                "model": "PINCOSLIGHT",
                "model_name": "PINCOSLIGHT",
                "name": "PIN2",
                "regs": [
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535
                ]
              }
            ]
          },
          "ts": 1792481895
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/information",
        "message": {
          "cmd": "OPMS_REPORT_INFO_POP",
          "contain": {
            "informations": {
              "gateway": {
                "fw_version": "v3.3",
                "hw_version": "TinkerBoardR2",
                "kernel": "5.15.80-rockchip",
                "network": {
                  "IP": "172.18.86.217",
                  "MAC": "581122e3b62c2001"
                }
              },
              "slave": {
                "connected": 1,
                "error": {
                  "battery": 1,
                  "firmware": 1,
                  "flash": 1
                },
                "fw_version": "v3.3",
                "hw_version": "v1.6"
              }
            }
          },
          "ts": 1792481902
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/sensor",
        "message": {
          "cmd": "OPMS_REPORT_INFO_SENSOR",
          "contain": {
            "control_ac": 1,
            "control_fan_pop": [
              100,
              100,
              100,
              100
            ],
            "control_ouput": [
              2,
              2,
              1,
              0
            ],
            "control_power_rs485": [
              1,
              0
            ],
            "current_ac": 235,
            "current_output": [
              0,
              0,
              0,
              0
            ],
            "current_power_rs485": [
              0,
              0
            ],
            "humidity": [
              54,
              255
            ],
            "input": [
              2,
              2,
              2,
              1,
              1,
              2,
              1,
              1
            ],
            "mode": 1,
            "power_rs485_pg": 1,
            "rps_fan_cooling": [
              121,
              102,
              0
            ],
            "rps_fan_pop": [
              61,
              49,
              49,
              0
            ],
            "state": 2,
            "temperature": [
              45,
              36,
              44,
              43
            ]
          },
          "ts": 1792481909
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/convert/sensor",
        "message": {
          "cmd": "OPMS_REPORT_INFO_SENSOR_SORTED",
          "contain": {
            "control_ac": 1,
            "control_fan_pop": [
              100,
              100,
              100,
              100
            ],
            "control_ouput": [
              2,
              2,
              1,
              0
            ],
            "control_power_rs485": [
              1,
              0
            ],
            "current_ac": 235,
            "current_output": [
              0,
              0,
              0,
              0
            ],
            "current_power_rs485": [
              0,
              0
            ],
            "humidity": [
              54,
              255
            ],
            "input": [
              2,
              2,
              2,
              1,
              1,
              2,
              1,
              1
            ],
            "mode": 1,
            "power_rs485_pg": 1,
            "rps_fan_cooling": [
              121,
              102,
              0
            ],
            "rps_fan_pop": [
              61,
              49,
              49,
              0
            ],
            "state": 2,
            "temperature": [
              45,
              36,
              44,
              43
            ]
          },
          "ts": 1792481909
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/console",
        "message": {
          "cmd": "OPMS_REPORT_TOTAL_CONSOLE",
          "contain": {
            "console": 2
          },
          "ts": 1792481910
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/rs485_devices",
        "message": {
          "cmd": "OPMS_REPORT_RS485_RUNTIME",
          "contain": {
            "rs485_devices": [
              {
                "connection_status": 1,
                "id": 1,
                "model": "CAC",
                "model_name": "CAC",
                "name": "Cabinet Air Conditioner",
                "regs": [
                  100,
                  1,
                  1,
                  1,
                  0,
                  0,
                  65535,
                  44.8,
                  200,
                  47.4,
                  41.2,
                  120,
                  200,
                  32767,
                  0,
                  65535,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  15,
                  3,
                  14,
                  5,
                  60,
                  10,
                  61,
                  3,
                  90,
                  10,
                  1
                ]
              },
              {
                "connection_status": 1,
                "id": 6,
                "model": "PINCOSLIGHT",
                "model_name": "PINCOSLIGHT",
                "name": "PIN1",
                "regs": [
                  53.08,
                  52.98,
                  0,
                  0,
                  50,
                  48.08,
                  96,
                  100,
                  34,
                  34,
                  3547,
                  3524,
                  65535,
                  1440,
                  7,
                  7,
                  3534,
                  3526,
                  3533,
                  3524,
                  3531,
                  3543,
                  3539,
                  3544,
                  3544,
                  3544,
                  3546,
                  3544,
                  3547,
                  3545,
                  3544,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0
                ]
              },
              {
                "connection_status": 2,
                "id": 5,
                "model": "PINCOSLIGHT",
                "model_name": "PINCOSLIGHT",
                "name": "PIN2",
                "regs": [
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535
                ]
              }
            ]
          },
          "ts": 1792481917
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/information",
        "message": {
          "cmd": "OPMS_REPORT_INFO_POP",
          "contain": {
            "informations": {
              "gateway": {
                "fw_version": "v3.3",
                "hw_version": "TinkerBoardR2",
                "kernel": "5.15.80-rockchip",
                "network": {
                  "IP": "172.18.86.217",
                  "MAC": "581122e3b62c2001"
                }
              },
              "slave": {
                "connected": 1,
                "error": {
                  "battery": 1,
                  "firmware": 1,
                  "flash": 1
                },
                "fw_version": "v3.3",
                "hw_version": "v1.6"
              }
            }
          },
          "ts": 1792481924
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/sensor",
        "message": {
          "cmd": "OPMS_REPORT_INFO_SENSOR",
          "contain": {
            "control_ac": 1,
            "control_fan_pop": [
              100,
              100,
              100,
              100
            ],
            "control_ouput": [
              2,
              2,
              1,
              0
            ],
            "control_power_rs485": [
              1,
              0
            ],
            "current_ac": 235,
            "current_output": [
              0,
              0,
              0,
              0
            ],
            "current_power_rs485": [
              0,
              0
            ],
            "humidity": [
              55,
              255
            ],
            "input": [
              2,
              2,
              2,
              1,
              1,
              2,
              1,
              1
            ],
            "mode": 1,
            "power_rs485_pg": 1,
            "rps_fan_cooling": [
              108,
              114,
              0
            ],
            "rps_fan_pop": [
              61,
              49,
              49,
              0
            ],
            "state": 2,
            "temperature": [
              45,
              36,
              44,
              44
            ]
          },
          "ts": 1792481931
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/convert/sensor",
        "message": {
          "cmd": "OPMS_REPORT_INFO_SENSOR_SORTED",
          "contain": {
            "control_ac": 1,
            "control_fan_pop": [
              100,
              100,
              100,
              100
            ],
            "control_ouput": [
              2,
              2,
              1,
              0
            ],
            "control_power_rs485": [
              1,
              0
            ],
            "current_ac": 235,
            "current_output": [
              0,
              0,
              0,
              0
            ],
            "current_power_rs485": [
              0,
              0
            ],
            "humidity": [
              55,
              255
            ],
            "input": [
              2,
              2,
              2,
              1,
              1,
              2,
              1,
              1
            ],
            "mode": 1,
            "power_rs485_pg": 1,
            "rps_fan_cooling": [
              108,
              114,
              0
            ],
            "rps_fan_pop": [
              61,
              49,
              49,
              0
            ],
            "state": 2,
            "temperature": [
              45,
              36,
              44,
              44
            ]
          },
          "ts": 1792481931
        }
      }
    ],
    [
      "mqtt_message_response",
      {
        "topic": "inf/fptvn/local/v2/uplink/rs485_devices",
        "message": {
          "cmd": "OPMS_REPORT_RS485_RUNTIME",
          "contain": {
            "rs485_devices": [
              {
                "connection_status": 1,
                "id": 1,
                "model": "CAC",
                "model_name": "CAC",
                "name": "Cabinet Air Conditioner",
                "regs": [
                  100,
                  1,
                  1,
                  1,
                  0,
                  0,
                  65535,
                  44.5,
                  200,
                  46.8,
                  41,
                  120,
                  200,
                  32767,
                  0,
                  65535,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  15,
                  3,
                  14,
                  5,
                  60,
                  10,
                  61,
                  3,
                  90,
                  10,
                  1
                ]
              },
              {
                "connection_status": 1,
                "id": 6,
                "model": "PINCOSLIGHT",
                "model_name": "PINCOSLIGHT",
                "name": "PIN1",
                "regs": [
                  53.09,
                  52.98,
                  0,
                  0,
                  50,
                  48.08,
                  96,
                  100,
                  34,
                  34,
                  3547,
                  3524,
                  65535,
                  1440,
                  7,
                  7,
                  3534,
                  3526,
                  3533,
                  3524,
                  3527,
                  3543,
                  3539,
                  3544,
                  3544,
                  3544,
                  3546,
                  3544,
                  3547,
                  3545,
                  3544,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0
                ]
              },
              {
                "connection_status": 2,
                "id": 5,
                "model": "PINCOSLIGHT",
                "model_name": "PINCOSLIGHT",
                "name": "PIN2",
                "regs": [
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535,
                  65535
                ]
              }
            ]
          },
          "ts": 1792481938
        }
      }
    ]
  ]
};

