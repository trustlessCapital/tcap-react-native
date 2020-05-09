const ethers = require('ethers');
import SecurityServices from './security';
import * as Keychain from 'react-native-keychain';
import ECEncryption from 'react-native-ec-encryption';
import base64 from 'react-native-base64';

const createWallet = (pk) => {
  return new ethers.Wallet(pk);
};

const createPrivateKey = () => {
  return ethers.Wallet.createRandom().privateKey;
};

const encryptWithEC = (text, label) => {
  return ECEncryption.encrypt({
    data: text,
    label: base64.encode(label)
  });
};

const decryptWithEC = (cipherText, label) => {
  return ECEncryption.decrypt({
    data: cipherText,
    label: base64.encode(label)
  });
};

const createAndStorePrivateKey = (pin, email) => {
  const pk = createPrivateKey();
  return SecurityServices.generateKey(pin, 'salt').then(key => {
    return SecurityServices.encryptData(pk, key).then(encryptedData => {
      return encryptWithEC(JSON.stringify(encryptedData), email).then(cipherText => {
        return Keychain.setGenericPassword(email, cipherText, {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      });
    });
  });
};

const getPrivateKey = (pin, email) => {
  return SecurityServices.generateKey(pin, 'salt').then(key => {
    return Keychain.getGenericPassword().then(cipherText => {
      cipherText = cipherText.password;
      return decryptWithEC(cipherText, email).then(encryptedData => {
        try {
          encryptedData = JSON.parse(encryptedData);
        } catch (e) {
          throw {error: 'Corrupted Data', status: -1};
        }
        return SecurityServices.decryptData(encryptedData, key)
          .then(data => {
            return data;
          })
          .catch(e => {
            throw {error: 'Invalid PIN', status: -2};
          });
      });
    });
  });
};

export default (WalletServices = {
  createAndStorePrivateKey,
  getPrivateKey,
  encryptWithEC,
  decryptWithEC
});

