@objc(CordovaPinlock)
class CordovaPinlock : CDVPlugin, JKLLockScreenViewControllerDataSource, JKLLockScreenViewControllerDelegate {
    var unlockObserver: NSObjectProtocol?
    var unlockCancelObserver: NSObjectProtocol?
    private lazy var unlockObserverSet: Bool = {
        return false
    }()
    
    private lazy var unlockCancelObserverSet: Bool = {
        return false
    }()
    
    private lazy var lockViewController: JKLLockScreenViewController = {
        let vc = JKLLockScreenViewController.init(nibName: String(describing: JKLLockScreenViewController.self), bundle: nil)
        vc.delegate = self
        vc.dataSource = self
        return vc
    } ()
    
    @objc(showLockNew:)
    func showLockNew(command: CDVInvokedUrlCommand) {
        let animated = command.arguments[0] as? Bool ?? true
        self.lockNew(animated: animated)
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(showLockChange:)
    func showLockChange(command: CDVInvokedUrlCommand) {
        let animated = command.arguments[0] as? Bool ?? true
        self.lockChange(animated: animated)
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(showLockVerification:)
    func showLockVerification(command: CDVInvokedUrlCommand) {
        let animated = command.arguments[0] as? Bool ?? true
        self.lockVerification(animated: animated)
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(showLockNormal:)
    func showLockNormal(command: CDVInvokedUrlCommand) {
        let animated = command.arguments[0] as? Bool ?? true
        self.lockNormal(animated: animated)
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(showLockCheckThenChange:)
    func showLockCheckThenChange(command: CDVInvokedUrlCommand) {
        let animated = command.arguments[0] as? Bool ?? true
        self.lockCheckChange(animated: animated)
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(showLockRemove:)
    func showLockRemove(command: CDVInvokedUrlCommand) {
        let animated = command.arguments[0] as? Bool ?? true
        self.lockRemove(animated: animated)
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(setupListener:)
    func setupListener(command: CDVInvokedUrlCommand) {
        startStatusMonitors()
        
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(removeListener:)
    func removeListener(command: CDVInvokedUrlCommand) {
        stopStatusMonitors()
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    func showLockScreenInMode(mode: LockScreenMode, animated: Bool = true) {
        if lockViewController.isBeingPresented {
            self.unlockWasCancelledLockScreenViewController(lockViewController)
            lockViewController.dismiss(animated: false) {
                
            }
        }
        
        lockViewController.lockScreenMode = mode
        
        self.viewController.present(lockViewController, animated: animated) {
        }
    }
    
    func lockNormal(animated: Bool = true) {
        self.showLockScreenInMode(mode: .normal, animated: animated)
    }
    
    func lockNew(animated: Bool = true) {
        self.showLockScreenInMode(mode: .new, animated: animated)
    }
    
    func lockChange(animated: Bool = true) {
        self.showLockScreenInMode(mode: .change, animated: animated)
    }
    
    func lockVerification(animated: Bool = true) {
        self.showLockScreenInMode(mode: .normalCancel, animated: animated)
    }
    
    func lockCheckChange(animated: Bool = true) {
        self.showLockScreenInMode(mode: .normalThenChange, animated: animated)
    }

    func lockRemove(animated: Bool = true) {
        self.showLockScreenInMode(mode: .remove, animated: animated)
    }
    
    func startStatusMonitors() {
        guard self.unlockObserver == nil else { return }
        guard !self.unlockObserverSet else { return }
        
        guard self.unlockCancelObserver == nil else { return }
        guard !self.unlockCancelObserverSet else { return }
        
        self.unlockObserverSet = true
        self.unlockObserver = NotificationCenter.default.addObserver(forName: NSNotification.Name(rawValue: "unlockWasSuccessfulLockScreenViewController"), object: nil, queue: OperationQueue.main) { (note) in
            let view = note.object as! JKLLockScreenViewController
            self.commandDelegate!.evalJs("cordova.fireDocumentEvent('pinlock:unlock:success',  {lockMode: '\(view.lockScreenMode)'})")
        }
        
        self.unlockCancelObserverSet = true
        self.unlockCancelObserver = NotificationCenter.default.addObserver(forName: NSNotification.Name(rawValue: "unlockWasCancelledLockScreenViewController"), object: nil, queue: OperationQueue.main) { (note) in
            let view = note.object as! JKLLockScreenViewController
            self.commandDelegate!.evalJs("cordova.fireDocumentEvent('pinlock:unlock:cancel',  {lockMode: '\(view.lockScreenMode)'})")
        }
    }
    
    func stopStatusMonitors() {
        if self.unlockObserver != nil {
            NotificationCenter.default.removeObserver(self.unlockObserver!)
            self.unlockObserver = nil
        }
        
        NotificationCenter.default.removeObserver(self, name: NSNotification.Name(rawValue: "unlockWasSuccessfulLockScreenViewController"), object: nil)
        self.unlockObserverSet = false
        
        if self.unlockCancelObserver != nil {
            NotificationCenter.default.removeObserver(self.unlockCancelObserver!)
            self.unlockCancelObserver = nil
        }
        
        NotificationCenter.default.removeObserver(self, name: NSNotification.Name(rawValue: "unlockWasCancelledLockScreenViewController"), object: nil)
        self.unlockCancelObserverSet = false
    }
    
    func unlockWasCancelledLockScreenViewController(_ lockScreenViewController: JKLLockScreenViewController!) {
        NotificationCenter.default.post(name: NSNotification.Name(rawValue: "unlockWasCancelledLockScreenViewController"), object: lockScreenViewController)
    }
    
    func unlockWasSuccessfulLockScreenViewController(_ lockScreenViewController: JKLLockScreenViewController!, pincode: String!) {
        if lockScreenViewController.lockScreenMode == .new || lockScreenViewController.lockScreenMode == .change {
            let defs = UserDefaults.init(suiteName: "group." + Bundle.main.bundleIdentifier!)
            let salt = self.randomString(length: 32)
            let pincodeHash = NSMutableData()
            pincodeHash.append(self.sha256data(string: pincode))
            pincodeHash.append(self.sha256data(string: salt))
            
            defs?.set(salt, forKey: "pinsalt")
            defs?.set(sha256data(data: pincodeHash as Data), forKey: "pin")
        } else if lockScreenViewController.lockScreenMode == .remove {
            let defs = UserDefaults.init(suiteName: "group." + Bundle.main.bundleIdentifier!)
            defs?.removeObject(forKey: "pin")
            defs?.removeObject(forKey: "pinsalt")
        }
        NotificationCenter.default.post(name: NSNotification.Name(rawValue: "unlockWasSuccessfulLockScreenViewController"), object: lockScreenViewController)
    }
    
    func lockScreenViewController(_ lockScreenViewController: JKLLockScreenViewController!, pincode: String!) -> Bool {
        let defs = UserDefaults.init(suiteName: "group." + Bundle.main.bundleIdentifier!)
        let salt = defs?.string(forKey: "pinsalt")
        let pincodeHash = NSMutableData()
        pincodeHash.append(self.sha256data(string: pincode))
        pincodeHash.append(self.sha256data(string: salt!))
        
        return defs?.data(forKey: "pin") == sha256data(data: pincodeHash as Data)
    }
    
    func allowTouchIDLockScreenViewController(_ lockScreenViewController: JKLLockScreenViewController!) -> Bool {
        return false
    }
    
    private func sha256data(string: String) -> Data {
        return self.sha256data(data: string.data(using:.utf8)!)
    }
    
    private func sha256data(data: Data) -> Data {
        let messageData = data
        var digestData = Data(count: Int(CC_SHA256_DIGEST_LENGTH))
        
        _ = digestData.withUnsafeMutableBytes {digestBytes in
            messageData.withUnsafeBytes {messageBytes in
                CC_SHA256(messageBytes, CC_LONG(messageData.count), digestBytes)
            }
        }
        
        return digestData
    }
    
    private func randomString(length: Int) -> String {
        let letters: NSString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let len = UInt32(letters.length)
        
        var randomString = ""
        
        for _ in 0 ..< length {
            let rand = arc4random_uniform(len)
            var nextChar = letters.character(at: Int(rand))
            randomString += NSString(characters: &nextChar, length: 1) as String
        }
        
        return randomString
    }
}
