
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

 
import React from 'react';
import { SafeAreaView,View } from 'react-native';
import PropTypes from 'prop-types';
import GlobalStyles from '../../../../../@GlobalStyles';
import styles from './styles';
import AppHeader from '../../../../../@Components/AppHeader';
 
const WithdrawStatusScreen = () =>{
    return(
        <SafeAreaView style={GlobalStyles.appContainer}>
            <View style={styles.wrapper}>
                <AppHeader headerTitle={'Withdraw Funds'}  />
            </View>
        </SafeAreaView>
    );
};
 
WithdrawStatusScreen.propTypes = {
    navigation:PropTypes.object.isRequired,
};
 
export default WithdrawStatusScreen;