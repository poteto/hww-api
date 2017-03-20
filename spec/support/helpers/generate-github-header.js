const generateGithubSignature = ({ signature, event, delivery }) => {
  return {
    'X-Github-Event': event,
    'X-Github-Delivery': delivery,
    'X-Hub-Signature': signature,
    'Accept': 'application/json'
  };
}

module.exports = generateGithubSignature;