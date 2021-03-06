
// Copyright (C) 2020  Trustless Pvt Ltd. <https://trustless.capital>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Created By @name Sukumar_Abhijeet,
 */
 
import React, { useEffect, useState } from 'react';
import { SafeAreaView,View,Text,TextInput,TouchableOpacity,ScrollView,Image } from 'react-native';
import PropTypes from 'prop-types';
import GlobalStyles from '../../../../../@GlobalStyles';
import AppHeader from '../../../../../@Components/AppHeader';
import styles from './styles';
import WalletService from '../../../../../@Services/wallet-service';
import walletUtils from '../../../../../@Services/wallet-utils';
import * as DashboardActions from '../../../../../@Redux/actions/dashboardActions';
import { connect } from 'react-redux';
import Colors from '../../../../../@Constants/Colors';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { moderateScale } from 'react-native-size-matters';
import Modal from 'react-native-modal';
import apiServices from '../../../../../@Services/api-services';
import LoadingIndicator from '../../../../../@Components/loading-indicator';
import ErrorDialog from '../../../../../@Components/error-dialog';
import { useIsFocused } from '@react-navigation/native';
import * as AccountActions from '../../../../../@Redux/actions/accountActions';
 
const TransferHomeScreen = ({...props}) =>{
    const isFocused = useIsFocused();

    const {
        updateVerifiedAccountBalances,verifiedBalances,exchangeRates,navigation,
        selectedCurrency,route,isAccountUnlockedFromServer,setIsAccountUnlocked,
        accountDetails
    } = props;

    const {email,phoneNumber}  = accountDetails;

    const walletService = WalletService.getInstance();
    const pk = walletService.pk;    
    const accAddress = walletUtils.createAddressFromPrivateKey(pk);
    
    const [selectedAsset, setSelectedAsset] = useState(verifiedBalances[0]);
    const [amountToTransfer, setAmountToTransfer] = useState('');
    // testAddress  (for testing)
    // const testAddress = '0xD8f647855876549d2623f52126CE40D053a2ef6A';
    const [address, setAddress] = useState('');
    const [remarks , setRemarks] = useState('');
    const [modal, setModal] = useState(false);
    const [fee , setFee] = useState(0);

    const [errorMessage, setErrorMessage] = useState('');
    const [errorTitle, setErrorTitle] = useState('');
    const [showError, setShowError] = useState(false);
    const [loader, setLoader] = useState(true);
    const [indicatingMssg , setIndicatingMsg] = useState('Please Wait...');

    const [showTransactionUi , setShowTransactionUi] = useState(false);

    useEffect(()=>{
        if(verifiedBalances.length) setShowTransactionUi(true);
        updateVerifiedAccountBalances(accAddress);
    },[]);

    useEffect(()=>{
        if(isFocused)
        {
            const {scannedAddress} =   route.params;
            if(scannedAddress) setAddress(scannedAddress);
        }
    },[isFocused]);

    useEffect(()=>{
        if(verifiedBalances.length) {
            setSelectedAsset(verifiedBalances[0]);
            setTimeout(()=>{
                setShowTransactionUi(true);
                refreshAssets(verifiedBalances[0]);
            },200);
        }
        else setLoader(false);
    },[verifiedBalances.length]);

    const checkAccountIsUnlocked = () =>{
        if(isAccountUnlockedFromServer)
        {
            setLoader(false);
            const data = { selectedAsset,address,remarks,fee,amountToTransfer};
            navigation.navigate('TransferConfirmationScreen',{transactionData:data});
        }
        else 
            fallbackToBlockChain();
    }; 
    
    const fallbackToBlockChain = async() =>{
        const isSigningKeySet = await walletService.unlockZksyncWallet(selectedAsset.symbol,true);
        if(isSigningKeySet)
        {
            setIsAccountUnlocked(true);
            apiServices.updateIsAccountUnlockedWithServer(email,phoneNumber).then();
            setLoader(false);
            const data = { selectedAsset,address,remarks,fee,amountToTransfer};
            navigation.navigate('TransferConfirmationScreen',{transactionData:data});
        }
        else{
            setLoader(false);
            navigation.navigate('AccountUnlockScreen');
        }
    };

    const refreshAssets = (currentAsset) =>{
        setIndicatingMsg('Please Wait...');
        setLoader(true);
        updateVerifiedAccountBalances(accAddress);
        apiServices.getTransferFundProcessingFee(currentAsset.symbol,accAddress)
            .then(data=>{
                setLoader(false);
                setFee(data.totalFee);
            })
            .catch(()=>{
                setLoader(false);
            });
    };

    const checkValidData = () =>{
        const max = walletUtils.getAssetDisplayText( selectedAsset.symbol,selectedAsset.value);
        const totalAmt = parseFloat(amountToTransfer) + parseFloat(fee);
        if(!amountToTransfer)
        {
            setShowError(true);
            setErrorMessage('Please enter an Amount to begin Transfer');
            setErrorTitle('Amount cannot be empty');
        }
        else if(totalAmt > max)
        {
            setShowError(true);
            setErrorMessage('Please add more funds to account before this transaction');
            setErrorTitle('Insufficient balance');
        }
        else if(!address.length)
        {
            setShowError(true);
            setErrorMessage('Please enter a valid address');
            setErrorTitle('Invalid Addess');
        }
        else{
            setLoader(true);
            setIndicatingMsg('Checking Account Please Wait.. It Takes a while to check from the Main BlockChain.');
            checkAccountIsUnlocked();
        }
    };

    const setNewAsset = (item) =>{
        setSelectedAsset(item);
        setModal(false);
        refreshAssets(item);
    };

    const renderAssetOptions = () => {
        return(
            <View style={styles.assetModal}>
                <View style={styles.modalHeader}>
                    <Text style={{color:Colors.white}}>Select From Available Funds</Text>
                </View>
                {
                    verifiedBalances.map((item,index)=>(
                        <TouchableOpacity key={index} onPress={()=>setNewAsset(item)} style={styles.eachAsset}>
                            <Text style={{fontSize:moderateScale(16),fontWeight:'bold'}}>{item.symbol.toUpperCase()}</Text>
                            <Text style={{fontSize:moderateScale(16),fontWeight:'bold'}}>{walletUtils.getAssetDisplayText( item.symbol,item.value)}</Text>
                        </TouchableOpacity>
                    ))
                }
            </View>
        );
    };

    const setMaxTransferLimit = () =>{
        const maxBalance = walletUtils.getAssetDisplayText( selectedAsset.symbol,selectedAsset.value);
        setAmountToTransfer(maxBalance-fee);
    };

    const renderAssets = () =>{
        if(showTransactionUi)
            return (
                <ScrollView>
                    <View style={GlobalStyles.primaryCard}>
                        <Text style={GlobalStyles.titleTypo}> Amount / Asset</Text>
                        <View style={GlobalStyles.inputBox}>
                            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:'100%'}}>
                                <TextInput
                                    keyboardType={'decimal-pad'}
                                    onChangeText={(amt) => {
                                        setAmountToTransfer(amt);
                                    }}
                                    placeholder={'Enter Amount'}
                                    placeholderTextColor={Colors.tintColorGreyedDark}
                                    style={styles.inputText}
                                    value={amountToTransfer.toString()}
                                />
                                <TouchableOpacity onPress={()=>setModal(true)} style={{flexDirection:'row',alignItems:'center'}}>
                                    <Text style={styles.assetTitle}>{selectedAsset.symbol.toUpperCase()}</Text>
                                    <Icon color={Colors.green} name={'angle-down'} size={moderateScale(22)} style={{marginLeft:moderateScale(5)}} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.bottomInputBar}>
                                <Text style={{color:Colors.green,maxWidth:moderateScale(150)}}> ~ {selectedCurrency.symbol} {walletUtils.getAssetDisplayTextInSelectedCurrency(selectedAsset.symbol.toLowerCase(),amountToTransfer, exchangeRates)}</Text>
                                <TouchableOpacity onPress={()=>setMaxTransferLimit()}>
                                    <Text style={{fontSize:moderateScale(12),fontWeight:'bold',color:Colors.activeTintRed}}>MAX : {walletUtils.getAssetDisplayText( selectedAsset.symbol,selectedAsset.value)} {selectedAsset.symbol.toUpperCase()} </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Text style={GlobalStyles.titleTypo}> To Addess</Text>
                        <View style={GlobalStyles.inputBox}>
                            <TextInput
                                autoCapitalize={'none'}
                                autoCorrect={false}
                                keyboardType={'email-address'}
                                onChangeText={(addr) => {
                                    setAddress(addr);
                                }}
                                placeholder={'Enter Address'}
                                placeholderTextColor={Colors.tintColorGreyedDark}
                                style={{color:Colors.white,width:'100%'}}
                                value={address}
                            />
                        </View>  

                        {/* TODO  -  FUTURE   */}
                        {/* <Text style={GlobalStyles.titleTypo}> Any Remarks</Text>
                        <View style={GlobalStyles.inputBox}>
                            <TextInput
                                autoCorrect={false}
                                onChangeText={remarks => {
                                    setRemarks(remarks);
                                }}
                                placeholder={'Short Remarks'}
                                placeholderTextColor={Colors.tintColorGreyedDark}
                                style={{color:Colors.white,width:'100%'}}
                            />
                        </View>      */}
                    </View>
                   
                </ScrollView>
            );
        return (
            <View style={GlobalStyles.primaryCard}>
                <Text style={{...GlobalStyles.titleTypo,textAlign:'center'}}> Your Account donot have</Text>
                <Text style={{...GlobalStyles.titleTypo,textAlign:'center'}}> sufficient balance</Text>
            </View>
        );
    };

    return(
        <SafeAreaView style={GlobalStyles.appContainer}>
            <View style={styles.wrapper}>
                <AppHeader headerTitle={'Transfer Funds'} >
                    <TouchableOpacity onPress={()=>navigation.navigate('ScannerScreen')}>
                        <Image 
                            resizeMode={'contain'} 
                            source={require('../../../../../../assets/images/icons/scanner.svg')} 
                            style={styles.qrScanner} 
                        />
                    </TouchableOpacity>
                </AppHeader>
                {renderAssets()}
                {
                    showTransactionUi && (
                        <>
                            <TouchableOpacity onPress={()=>checkValidData()} style={styles.transferButton}>
                                <Text style={styles.proceedText}>Proceed</Text>
                            </TouchableOpacity>
                            <Text style={styles.feeText}>
                        Fee : {fee}{' '+selectedAsset.symbol.toUpperCase()+' '}
                        ~ {selectedCurrency.symbol} {walletUtils.getAssetDisplayTextInSelectedCurrency(selectedAsset.symbol.toLowerCase(),fee, exchangeRates)}
                            </Text>
                        </>
                    )
                }
            </View>
            <Modal
                animationIn={'slideInRight'}
                animationOut={'slideOutRight'}
                backdropColor={'#000'}
                dismissable={true}
                isVisible={modal}
                onBackButtonPress={()=>setModal(false)}
                onBackdropPress={()=>setModal(false)}
                style={{justifyContent:'center',alignItems:'center',padding:0}}
                useNativeDriver={true}
            >
                {renderAssetOptions()}
            </Modal>
            <LoadingIndicator
                message={indicatingMssg}
                visible={loader}
            />
            <ErrorDialog
                message={errorMessage}
                onDismiss={() => {
                    setShowError(false);
                }}
                title={errorTitle}
                visible={showError}
            />
        </SafeAreaView>
    );
};
 
TransferHomeScreen.propTypes = {
    accountDetails:PropTypes.object.isRequired,
    exchangeRates:PropTypes.array.isRequired,
    isAccountUnlockedFromServer:PropTypes.bool.isRequired,
    navigation:PropTypes.object.isRequired,
    route:PropTypes.object.isRequired,
    selectedCurrency:PropTypes.object.isRequired,
    setIsAccountUnlocked:PropTypes.func.isRequired,
    updateVerifiedAccountBalances:PropTypes.func.isRequired,
    verifiedBalances:PropTypes.array.isRequired,
};

function mapStateToProps(state){
    return{
        accountDetails : state.account.accountDetails,
        verifiedBalances : state.dashboard.verifiedBalances,
        exchangeRates : state.dashboard.exchangeRates,
        selectedCurrency : state.currency.selectedCurrency,
        isAccountUnlockedFromServer : state.account.isAccountUnlocked,
    };
}

function mapDispatchToProps(dispatch){
    return{
        updateVerifiedAccountBalances:address =>
            dispatch(DashboardActions.updateVerifiedAccountBalances(address)),
        setIsAccountUnlocked : isUnlocked =>
            dispatch(AccountActions.setIsAccountUnlocked(isUnlocked))
    };
}
 
export default connect(mapStateToProps,mapDispatchToProps)(TransferHomeScreen);