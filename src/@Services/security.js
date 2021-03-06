import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-community/async-storage';
import { NativeModules, Platform } from 'react-native';
import { PIN_SCREEN_MODE } from '../@Constants';
import Config from '../@Config/default';

import moment from 'moment';

var Aes = NativeModules.Aes;
const {LOCAL_AUTH_TIMEOUT} = Config;

const handleLocalAuthorization = (
    component,
    nextAppState,
    state,
    authState,
) => {
    if (state.appState.match(/inactive|background/) && nextAppState === 'active') {
        if(Platform.OS!=='ios')
            authenticateWithTouchID(component, authState);
    }
    if(Platform.OS === 'ios')
    {
        if(state.appState === 'inactive' && nextAppState === 'background')
        {
            const appInBackgroundDate = new Date();
            component.props.setAppBackgroundDate(appInBackgroundDate);
        }
        if(state.appState === 'inactive' && nextAppState === 'active')
        {
            const  start = moment(component.props.appBackgroundDate);
            const  end = moment(new Date());
            const  timeout = (end.diff(start, 'seconds'));
            if(timeout > LOCAL_AUTH_TIMEOUT) authenticateWithTouchID(component, authState);
        }
    }
    else{
        if(state.appState === 'active' && nextAppState === 'active')
        {   
            const start = moment(component.props.appBackgroundDate);
            const  end = moment(new Date());
            const timeout = (end.diff(start, 'seconds'));
            if(timeout > LOCAL_AUTH_TIMEOUT) authenticateWithTouchID(component, authState);
        }
        if(state.appState === 'active' && nextAppState === 'background')
        {
            const appInBackgroundDate = new Date();
            component.props.setAppBackgroundDate(appInBackgroundDate);
        }
    }
};

const authenticateWithTouchID = async (component, authState) => {
    let hasHardware = await LocalAuthentication.hasHardwareAsync();

    let isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
        authState.isAuthAsked = true;
        let authenticationResult = await LocalAuthentication.authenticateAsync().catch((e) => {
            component.props.navigation.navigate('Auth',{
                screen:'PINScreen',
                params: { mode: PIN_SCREEN_MODE.LOGIN_PIN, },
            });
        });
        if (authenticationResult.success) {
            const appInBackgroundDate = new Date();
            component.props.setAppBackgroundDate(appInBackgroundDate);
        }
        else
        {
            component.props.navigation.navigate('Auth',{
                screen:'PINScreen',
                params: { mode: PIN_SCREEN_MODE.LOGIN_PIN, },
            });
        }
    }
};

const authenticateOnStartup = async () => {
    let hasHardware = await LocalAuthentication.hasHardwareAsync();

    let isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
        return LocalAuthentication.authenticateAsync();
    }

    return Promise.resolve();
};

const encryptData = (text, key) => {
    return Aes.randomKey(16).then((iv) => {
        return Aes.encrypt(text, key, iv).then((cipher) => ({
            cipher,
            iv,
        }));
    });
};

const decryptData = (encryptedData, key) =>
    Aes.decrypt(encryptedData.cipher, key, encryptedData.iv);

const generateKey = (password, salt) => {
    return Aes.pbkdf2(password, salt, 5000, 256);
};

const storeAccountDetails = (accountDetails, pin) => {
    return generateKey(pin, 'salt').then((key) => {
        let dataText = JSON.stringify(accountDetails);
        return encryptData(dataText, key).then(encryptedData => {
            return AsyncStorage.setItem('account', JSON.stringify(encryptedData));
        });
    });
};

const clearStorageAndKey = () => {
    return AsyncStorage.clear();
};

const fetchAccountDetails = (pin) => {
    return generateKey(pin, 'salt').then((key) => {
        return AsyncStorage.getItem('account').then(encryptedData => {
            try {
                encryptedData = JSON.parse(encryptedData);
            } catch (e) {
                throw { error: 'Corrupted Data', status: -1 };
            }
            return decryptData(encryptedData, key)
                .then(data => {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        throw { error: 'Corrupted Data', status: -1 };
                    }
                    if (!data.email || !data.phoneNumber) {
                        throw { error: 'Corrupted Data', status: -1 };
                    }
                    return data;
                })
                .catch(e => {
                    throw { error: 'Invalid PIN', status: -2 };
                });
        });
    });
};

export default (SecurityServices = {
    handleLocalAuthorization,
    authenticateOnStartup,
    storeAccountDetails,
    fetchAccountDetails,
    generateKey,
    decryptData,
    encryptData,
    clearStorageAndKey,
});
