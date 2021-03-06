'use strict';

const Adapter = require('gateway-addon').Adapter;
const Database = require('gateway-addon').Database;
const manifest = require('../manifest.json');
const PrinterDevice = require('./device');

class HPCP1515nAdapter extends Adapter {
  constructor(addonManager) {
    super(addonManager, 'HPCP1515nAdapter', manifest.id);
    addonManager.addAdapter(this);
    this.savedDevices = [];

    this.db = new Database(this.packageName);
    this.db.open().then((() => {
      return this.db.loadConfig();
    }).bind(this)).then(((config) => {
      this.config = config;
      return Promise.resolve();
    }).bind(this)).then((() => {
      for (const conf of this.config.devices) {
        const d = new PrinterDevice(this, conf.ip, conf.name&&conf.name!='' ? conf.name : null);
        this.handleDeviceAdded(d);
        if (this.savedDevices.includes(d.id)) {
          console.log('Thing saved later', d.id);
          d.run();
        }
      }
    }).bind(this)).catch(console.error);
  }

  handleDeviceAdded(device, reload = false) {
    super.handleDeviceAdded(device);
    if (reload) return;
    console.log('Thing added', device.id);
    device.connectedNotify(false);
  }

  handleDeviceUpdated(device) {
    super.handleDeviceAdded(device, true);
    console.log('Thing updated', device.id);
  }

  handleDeviceSaved(deviceId) {
    super.handleDeviceSaved(deviceId);
    this.savedDevices.push(deviceId);
    if (this.devices[deviceId]) {
      const device = this.devices[deviceId];
      console.log('Thing saved', deviceId);
      device.connectedNotify(false);
      device.run();
    }
  }

  startPairing(_timeoutSeconds) {
    console.log('pairing started');
  }

  cancelPairing() {
    console.log('pairing cancelled');
  }

  handleDeviceRemoved(device) {
    super.handleDeviceRemoved(device);
    device.stop();
    console.log('Thing removed', device.id);
  }

  removeThing(device) {
    console.log('removeThing(', device.id, ')');

    const newdevice = new device.__proto__.constructor(this, device.tid, device.key, device.name);

    this.handleDeviceRemoved(device);
    if (this.savedDevices.includes(device.id))
      this.savedDevices.splice(this.savedDevices.indexOf(device.id), 1);

    this.handleDeviceAdded(newdevice);
  }

  cancelRemoveThing(device) {
    console.log('cancelRemoveThing(', device.id, ')');
  }
}

module.exports = HPCP1515nAdapter;
