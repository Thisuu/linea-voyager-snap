const snapId = 'npm:@consensys/linea-voyager';
const snapVersion = '^0.7.1';
let isAccountConnected = false;

/*
 * Use EIP-6963 to detect MetaMask
 */

const MetaMaskFound = async (providerDetail) => {
  document.getElementById('loading').className = 'found';

  const { provider } = providerDetail;

  /* first let's see if the Snap is already installed */
  try {
    const snaps = await provider.request({
      method: 'wallet_getSnaps',
    });
    if (Object.keys(snaps).includes(snapId)) {
      // snap installed, go to step 2
      return await snapAlreadyInstalled(provider);
    }
    // the snap was not installed
  } catch (error) {}

  const btn = document.createElement('button');
  btn.className = 'btn btn-primary btn-lg';
  btn.textContent = 'Install Snap';

  const caption = document.createElement('p');
  caption.className = 'caption';
  caption.textContent = 'Step 1';

  btn.onclick = async (event) => {
    event.preventDefault();
    try {
      const result = await provider.request({
        method: 'wallet_requestSnaps',
        params: {
          [snapId]: {
            version: snapVersion,
          },
        },
      });

      if (result) {
        try {
          const snaps = await provider.request({
            method: 'wallet_getSnaps',
          });
          if (Object.keys(snaps).includes(snapId)) {
            // snap installed, go to step 2
            await snapInstalled(provider);
          } else {
            // the snap was not installed
          }
        } catch (error) {}
      }
    } catch (error) {}
  };
  document.getElementById('loading').textContent = '';
  document.getElementById('loading').appendChild(caption);
  document.getElementById('loading').appendChild(btn);
};

const snapAlreadyInstalled = async (provider) => {
  const response = await provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId,
      request: {
        method: 'getLxpAddress',
      },
    },
  });
  if (response !== null) {
    // get the watched address
    const message = document.createElement('p');
    message.textContent = 'Watched address: ';
    const address = document.createElement('code');
    address.textContent = `${response}`;
    message.appendChild(address);
    document.getElementById('context').textContent = '';
    document.getElementById('context').appendChild(message);
    isAccountConnected = true;
  } else {
  }
  await snapInstalled(provider, true);
};

const snapInstalled = async (provider, skippedStep1 = false) => {
  const btn = document.createElement('button');
  btn.id = 'accountConnectionButton';
  btn.className = 'btn btn-primary btn-lg';
  btn.textContent = isAccountConnected ? 'Change Account' : 'Connect Account';

  const caption = document.createElement('p');
  caption.className = 'caption';
  caption.textContent = 'Step 2';

  const alternate = document.createElement('p');
  alternate.className = 'alt';
  alternate.textContent = 'Or ';
  const alternateLink = document.createElement('a');
  alternateLink.textContent = 'watch an address';
  alternate.appendChild(alternateLink);

  alternateLink.onclick = async (event) => {
    event.preventDefault();
    const response = await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'watchLxpAddress',
        },
      },
    });
    const message = document.createElement('p');
    if (response !== null) {
      // get the watched address
      message.textContent = 'Watched address: ';
      const address = document.createElement('code');
      address.textContent = `${response}`;
      message.appendChild(address);
    } else {
      message.textContent = 'Failed to watch address';
    }
    document.getElementById('context').textContent = '';
    document.getElementById('context').appendChild(message);
  };

  btn.onclick = async (event) => {
    event.preventDefault();
    const accounts = await provider.request({
      method: 'eth_requestAccounts',
      params: [],
    });
    if (accounts.length > 0) {
      const response = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'setLxpAddress',
            params: {
              lxpAddress: accounts[0],
            },
          },
        },
      });
      const message = document.createElement('p');
      if (response === accounts[0]) {
        // get the first entry
        message.textContent = 'Connected address: ';
        const address = document.createElement('code');
        address.textContent = `${accounts[0]}`;
        message.appendChild(address);
        isAccountConnected = true;
        try {
          document.getElementById('accountConnectionButton').textContent =
            'Change Address';
        } catch (error) {}
      } else {
        message.textContent = 'Failed to connect address';
        isAccountConnected = false;
        try {
          document.getElementById('accountConnectionButton').textContent =
            'Connect Address';
        } catch (error) {}
      }
      document.getElementById('context').textContent = '';
      document.getElementById('context').appendChild(message);
    }
  };
  document.getElementById('loading').textContent = '';
  if (!skippedStep1) {
    document.getElementById('loading').appendChild(caption);
  }
  document.getElementById('loading').appendChild(btn);
  document.getElementById('loading').appendChild(alternate);
};

window.onload = function () {
  window.addEventListener('eip6963:announceProvider', (event) => {
    /* event.detail contains the discovered provider interface */
    const providerDetail = event.detail;

    /*
     * You could take one of these cases and use it for your needs,
     * or set up a conditional that takes any of these possibilities,
     * or prompt the user to choose which MetaMask flavor they want to use
     * in case they have multiple MetaMask extensions installed at the same time
     */
    if (providerDetail.info.rdns == 'io.metamask') {
      /* this is MetaMask */
      MetaMaskFound(providerDetail);
    } else if (providerDetail.info.rdns == 'io.metamask.flask') {
      /* this is MetaMask Flask */
      MetaMaskFound(providerDetail);
    } else if (providerDetail.info.rdns == 'io.metamask.mmi') {
      /* this is MetaMask Institutional */
      MetaMaskFound(providerDetail);
    }
  });

  window.dispatchEvent(new Event('eip6963:requestProvider'));

  setTimeout(() => {
    if (document.getElementById('loading').className !== 'found') {
      /* Assume MetaMask was not detected */
      document.getElementById('loading').textContent = '';
      document
        .getElementById('loading')
        .insertAdjacentHTML(
          'afterbegin',
          "Please install <a href='https://metamask.io/'>MetaMask</a> first.",
        );
    }
  }, 1000);
};
