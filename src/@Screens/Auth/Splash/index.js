/**
 * Create By @name Sukumar_Abhijeet
 */

import React, { useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Image,
    Text
} from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';
const logoImage = require('../../../../assets/splash.png');
import AsyncStorage from '@react-native-community/async-storage';
import WalletService from '../../../@Services/wallet-service';

const SplashScreen = ({...props}) =>{

    const {navigation:{replace,reset},route:{params : AppParams}} = props;

    useEffect(()=>{
        if(AppParams.accountDetails)
            setTimeout(()=>{reloadApp();},300);
        else
            loadResourcesAndDataAsync();
    },[]);

    const reloadApp = () =>{
        reset({
            index: 0,
            routes: [{ name: 'App' ,params:AppParams}]
        });
    };

    async function loadResourcesAndDataAsync() {
        let account = null;
        try {
            let performTimeConsumingTask = async () => {
                return new Promise(resolve =>
                    setTimeout(() => {
                        resolve('result');
                    }, 2000),
                );
            };
    
            await performTimeConsumingTask();
            WalletService.getInstance();
    
            account = await AsyncStorage.getItem('account');
        } catch (e) {
            console.warn(e);
        } finally {
            if (account) {
                replace('PINScreen');
            } else {
                replace('SignUp');
            }
        }
    }

    return(
        <SafeAreaView style={styles.wrapper}>
            <View style={styles.imageBox}>
                <Image resizeMode={'contain'} source={logoImage} style={styles.titleImage} />
            </View>
            <Text style={styles.beta}>( BETA )</Text>
        </SafeAreaView>
    );
};

SplashScreen.propTypes = {
    navigation:PropTypes.object.isRequired,
    route:PropTypes.object.isRequired,
};

export default SplashScreen;
